import * as bcrypt from 'bcrypt';
import {
  BeforeCreate,
  BeforeUpdate,
  Entity,
  Enum,
  Index,
  Property,
} from '@mikro-orm/core';
import type { EventArgs } from '@mikro-orm/core';
import { Exclude } from 'class-transformer';
import type {
  SerializedDimensionalAffinities,
  SerializedEngagementMetrics,
  SerializedVisitEntry,
} from '@tailor-cms/garment';
import { BaseEntity } from '@/database/entities/base.entity';
import { UserRepository } from '@/modules/user/user.repository';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity({ tableName: 'users', repository: () => UserRepository })
export class User extends BaseEntity {
  @Property({ unique: true, nullable: false })
  @Index()
  email!: string;

  @Property({ hidden: true, nullable: false })
  @Exclude()
  password!: string;

  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  @Property({ nullable: true, length: 200 })
  firstName?: string;

  @Property({ nullable: true, length: 200 })
  lastName?: string;

  @Property({ nullable: true, type: 'text' })
  imgUrl?: string;

  // =========================================================================
  // LEARNER PROFILE (activity JSONB)
  // =========================================================================
  // Stores learner profile data for personalized recommendations.
  // Set by: ProfileBuilder.build() (onboarding), ProfileUpdater (activity)
  // Used by: ProfileMatcher for recommendation scoring
  //
  // EXAMPLE (full profile with sample data):
  // {
  //   onboarding: {
  //     survey: [
  //       { questionId: 'interests', selectedValues: ['0'], tagAffinities: { ... } },
  //       { questionId: 'goals', selectedValues: ['1'], tagAffinities: {} }
  //     ],
  //     completedAt: '2025-01-15T10:30:00.000Z'
  //   },
  //   experienceLevel: 'intermediate',
  //   goals: ['Build projects', 'Get certified'],
  //   recentTags: ['data-science', 'python', 'machine-learning'],
  //   affinities: {
  //     topic: {
  //       'data-science': {
  //         value: 0.85,
  //         confidence: 0.6,
  //         sources: { onboarding: 0.5, behavioral: 0.35, explicit: 0 },
  //         lastUpdated: '2025-01-20T14:00:00.000Z',
  //         interactionCount: 12
  //       },
  //       'python': { value: 0.72, confidence: 0.55, ... }
  //     },
  //     skill: { 'debugging': { value: 0.4, ... } },
  //     concept: {},
  //     industry: { 'fintech': { value: 0.6, ... } },
  //     tool: { 'jupyter': { value: 0.5, ... } },
  //     goal: {}
  //   },
  //   visitHistory: [
  //     {
  //       id: 'visit_abc123',
  //       nodeId: 'lesson-456',
  //       repositoryId: 'repo-789',
  //       nodeType: 'activity',
  //       action: 'complete',
  //       timestamp: '2025-01-20T14:30:00.000Z',
  //       duration: 180000,
  //       content: {
  //         title: 'Introduction to Pandas',
  //         thumbnail: 'https://...',
  //         difficulty: 'intermediate',
  //         tags: ['python', 'data-science', 'pandas'],
  //         bloomLevel: 'apply'
  //       },
  //       context: {
  //         sessionId: '1706123456789-abc',
  //         sequenceNumber: 3,
  //         entryPoint: 'recommendation',
  //         referrer: '/recommendations'
  //       },
  //       engagement: {
  //         scrollDepth: 95,
  //         interactionCount: 8,
  //         contentProgress: [
  //           { type: 'MUX_VIDEO', percent: 100 },
  //           { type: 'SINGLE_CHOICE', data: { attempts: 1, correct: true, score: 100 } }
  //         ]
  //       }
  //     }
  //   ],
  //   engagement: {
  //     velocity: 72,
  //     journeyStage: 'targeted',
  //     totalInteractions: 45,
  //     totalTimeSpent: 7200000,
  //     streakDays: 5,
  //     lastActiveAt: '2025-01-20T14:30:00.000Z'
  //   },
  //   lastUpdatedAt: '2025-01-20T14:30:00.000Z'
  // }
  // =========================================================================
  @Property({ type: 'jsonb', nullable: true })
  activity?: {
    // Onboarding questionnaire data
    // answers param format: questionId -> selected answer indexes
    //   { interests: [0] } = index 0 selected -> 'Data Science' -> tags applied
    onboarding?: {
      survey: Array<{
        questionId: string;
        selectedValues: string[];
        tagAffinities: Record<string, number>;
      }>;
      completedAt?: Date;
    };
    // Learner's experience/difficulty level: 'beginner' | 'intermediate' | 'advanced'
    experienceLevel?: string;
    // Learning goals extracted from goal-category survey questions
    goals?: string[];
    // Recently interacted tags (most recent first, max 50)
    recentTags?: string[];
    // 6D affinities - structured by dimension with rich metadata per tag
    // -------------------------------------------------------------------------
    // SET BY:
    //  - onboarding survey (ProfileBuilder.build)
    //  - activity tracking (ProfileUpdater)
    // USED BY: ProfileMatcher for recommendation scoring
    // -------------------------------------------------------------------------
    // Dimensions (from content tag categories):
    //   - topic: subject matter (e.g. 'async-programming', 'databases')
    //   - skill: practical abilities (e.g. 'debugging', 'testing')
    //   - concept: theoretical principles (e.g. 'encapsulation', 'immutability')
    //   - industry: business domains + problem categories (e.g. 'fintech', 'web')
    //   - tool: technologies/frameworks (e.g. 'react', 'postgresql')
    //   - goal: learning objectives (e.g. 'career-advancement', 'certification')
    //
    // Each tag has AffinityScore:
    //   - value (0-1): learner's interest strength for recommendation ranking
    //     Formula:
    //       tagWeight * actionWeight * nodeTypeWeight * dimensionWeight * 0.1
    //       actionWeight: complete=1.0, bookmark=0.8, view=0.3-0.5, skip=-0.3
    //       nodeTypeWeight: repo=1.0, activity=0.5, container=0.3, element=0.2
    //       dimensionWeight: topic/skill/tool=1.0, concept/goal=0.8, industry=0.7
    //       0.1 = learning rate (prevents large jumps from single interactions)
    //     Example: complete activity with topic tag (weight 0.8)
    //       0.8 [tagWeight; from content analysis] *
    //       1.0 [complete; interaction weight] *
    //       0.5 [activity; node weight] *
    //       1.0 [topic; dimension weight] *
    //       0.1 [learning rate; prevents large jumps] = 0.04
    //   - confidence (0-1): reliability for weighting in recommendations
    //     Formula: min(0.95, 0.3 + log10(interactionCount + 1) * 0.3)
    //       - 0.95: max cap (never fully certain, always room to learn more)
    //       - 0.3: base confidence (minimum after first behavioral interaction)
    //       - +1: offset so log10 input is always ≥1 (log10(0) is undefined/-Infinity)
    //       - log10(): logarithmic growth = diminishing returns
    //         Math: log10(x) answers "10 to what power equals x?"
    //           log10(1)=0, log10(10)=1, log10(100)=2, log10(1000)=3
    //         Each 10x increase in interactions only adds +1 to the log value,
    //         so going 1→10 has the same effect as 10→100 or 100→1000
    //       - *0.3: growth rate (scales log output to fit 0-1 range)
    //     Confidence examples (formula: 0.3 + log10(count+1) * 0.3, capped at 0.95):
    //       count=0:   0.3 + log10(1)*0.3  = 0.3 + 0*0.3     = 0.30
    //       count=9:   0.3 + log10(10)*0.3 = 0.3 + 1*0.3     = 0.60
    //       count=99:  0.3 + log10(100)*0.3 = 0.3 + 2*0.3    = 0.90
    //       count=999: 0.3 + log10(1000)*0.3 = 0.3 + 3*0.3   = 0.95 (capped)
    //     Example: 10 interactions
    //       min(
    //         0.95 [max cap; never fully certain],
    //         (0.3 [base confidence; minimum after first interaction]) +
    //         (log10(10 [interaction count] + 1 [offset; log10(0) is undefined])) *
    //         (0.3 [growth rate; scales log to 0-1 range])
    //       ) = 0.61
    //     Onboarding starts at 0.5: user explicitly stated interest via survey,
    //       but hasn't yet demonstrated it through actual content interactions
    //   - sources: { onboarding, behavioral, explicit }
    //     onboarding: from survey answers (initial profile)
    //     behavioral: from content interactions (view, complete, skip, bookmark)
    //     explicit: directly stated preference (future use)
    //   - lastUpdated: ISO timestamp of last change
    //   - interactionCount: number of updates for confidence calculation
    affinities: SerializedDimensionalAffinities;
    // Last 100 visits with full context. Each entry captures:
    //   - id, nodeId, repositoryId, nodeType, action, timestamp, duration
    //   - content: metadata
    //     - title, thumbnail, difficulty, tags, bloomLevel
    //   - context: navigation
    //     - referrer: where user came from
    //     - entryPoint: how user arrived (direct, search, recommendation, path)
    //     - sessionId: groups visits in same session
    //     - sequenceNumber: order within session
    //     - learningPathId: if part of a learning path
    //   - engagement: signals
    //     - scrollDepth: 0-100, how far user scrolled
    //     - interactionCount: clicks, interactions within content
    //     - contentProgress: array of element-specific progress
    //       - type: 'video' | 'audio' | 'pdf' | 'quiz' | string
    //       - percent: 0-100, progress for media types
    //       - data: type-specific data (e.g., quiz: { attempts, correct, score, selected })
    //   - device: info (type: desktop, mobile, tablet)
    //   - affinityChanges: resulting profile updates
    //     (dimension, tag, oldValue, newValue, delta)
    visitHistory: SerializedVisitEntry[];
    // Engagement metrics: measures learning momentum and progression
    //   - velocity (0-100): engagement momentum, decays over time
    //     Formula:
    //     min(100, (100 - hoursSinceActivity*2) +
    //     completionBoost + scrollBoost) *
    //     streakMultiplier
    //       - Base: 100 - hoursSinceActivity*2 (decays ~2 points/hour)
    //       - completionBoost: min(recentCompletions*5, 25) from last 20 visits
    //       - scrollBoost: avgScrollDepth*0.2 from last 20 visits
    //       - streakMultiplier: 1 + streakDays*0.05
    //   - journeyStage: current learning phase based on velocity + matchQuality
    //     - browse: default, exploring without clear pattern
    //     - explore: 10+ interactions, velocity≥40
    //     - targeted: velocity≥70, matchQuality≥85
    //     - flow: velocity≥90, matchQuality≥95 (optimal learning state)
    //   - totalInteractions: cumulative count of all recorded interactions
    //   - totalTimeSpent: cumulative learning time in milliseconds
    //   - streakDays: consecutive days with activity (resets if day missed)
    //   - lastActiveAt: ISO timestamp of most recent activity
    engagement: SerializedEngagementMetrics;
    // Last activity update
    lastUpdatedAt: Date;
  };

  @Property({ nullable: true })
  lastLoginAt?: Date;

  @Property({ persist: false })
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  @Property({ persist: false })
  get fullName(): string | null {
    const { firstName, lastName } = this;
    return firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || lastName || null;
  }

  @Property({ persist: false })
  get label(): string {
    return this.fullName || this.email;
  }

  @Property({ persist: false })
  get profile() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      label: this.label,
      imgUrl: this.imgUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  @BeforeCreate()
  @BeforeUpdate()
  private async hashPassword(args: EventArgs<User>) {
    // Only hash if password is being set/changed and isn't already hashed
    if (this.password && !this.password.startsWith('$2')) {
      // Get saltRounds from MikroORM config (injected from ConfigService)
      // Falls back to env for CLI operations like seeding
      const config = args.em.config.getAll() as any;
      const saltRounds =
        config.saltRounds || parseInt(process.env.AUTH_SALT_ROUNDS || '10', 10);
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  @BeforeCreate()
  @BeforeUpdate()
  normalizeEmail() {
    if (!this.email) return;
    this.email = this.email.toLowerCase().trim();
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const { fullName, label, isAdmin } = this;
    const isDeleted = !!this.deletedAt;
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName,
      label,
      imgUrl: this.imgUrl,
      activity: this.activity,
      isAdmin,
      isDeleted,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
