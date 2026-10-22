<template>
  <div class="tag-network-graph">
    <svg ref="svgRef" :width="width" :height="height" />
  </div>
</template>

<script lang="ts" setup>
import * as d3 from 'd3';

interface Props {
  tags: Array<{ tag: string; count: number; category: string }>;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
});

const emit = defineEmits<{
  'tag-click': [tag: string];
}>();

interface TagNode extends d3.SimulationNodeDatum {
  id: string;
  tag: string;
  count: number;
  category: string;
}

interface TagLink {
  source: string | TagNode;
  target: string | TagNode;
  value: number;
}

const svgRef = ref<SVGSVGElement | null>(null);

const GRAPH_CONFIG = {
  zoom: { min: 0.5, max: 3 },
  forces: {
    linkDistance: 80,
    linkStrength: 0.3,
    chargeStrength: -200,
    collisionPadding: 5,
  },
  node: {
    minRadius: 8,
    maxRadius: 30,
    strokeWidth: 2,
    strokeWidthHover: 4,
  },
  link: {
    opacity: 0.3,
  },
  animation: {
    duration: 200,
    alphaTarget: 0.3,
  },
  label: {
    minFontSize: 10,
    badgeFontSize: 9,
  },
} as const;

const CATEGORY_CONFIG = {
  topic: { color: '#1e88e5', label: 'Topic' },
  skill: { color: '#8e24aa', label: 'Skill' },
  concept: { color: '#00897b', label: 'Concept' },
  industry: { color: '#fb8c00', label: 'Industry' },
  tool: { color: '#43a047', label: 'Tool' },
} as const;

const DEFAULT_CATEGORY = 'topic';

const nodes = computed<TagNode[]>(() =>
  props.tags.map((t) => ({
    id: t.tag,
    tag: t.tag,
    count: t.count,
    category: t.category || DEFAULT_CATEGORY,
  })),
);

const links = computed<TagLink[]>(() => {
  const sorted = [...props.tags].sort((a, b) => a.tag.localeCompare(b.tag));
  const result: TagLink[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (!current || !next) continue;

    result.push({
      source: current.tag,
      target: next.tag,
      value: Math.min(current.count, next.count),
    });

    if (i < sorted.length - 3) {
      const skip = sorted[i + 3];
      if (skip) {
        result.push({
          source: current.tag,
          target: skip.tag,
          value: Math.min(current.count, skip.count) * 0.5,
        });
      }
    }
  }
  return result;
});

const maxCount = computed(() => Math.max(...props.tags.map((t) => t.count), 1));

function getCategoryColor(category: string): string {
  return (
    CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.color ||
    CATEGORY_CONFIG[DEFAULT_CATEGORY].color
  );
}

function getCategoryLabel(category: string): string {
  return (
    CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label || category
  );
}

function getNodeRadius(count: number): number {
  const { minRadius, maxRadius } = GRAPH_CONFIG.node;
  return minRadius + (count / maxCount.value) * (maxRadius - minRadius);
}

function createTooltipText(node: TagNode): string {
  const percentage = Math.round((node.count / maxCount.value) * 100);
  return `${node.tag}
  Category: ${getCategoryLabel(node.category)}
  Occurrences: ${node.count} repositories
  Relative frequency: ${percentage}%
  💡 Node size represents how common this tag is
  🎨 Color represents the tag category
  Click to view all content with this tag`;
}

function setupZoom(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
) {
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([GRAPH_CONFIG.zoom.min, GRAPH_CONFIG.zoom.max])
    .on('zoom', (event) => g.attr('transform', event.transform));

  svg.call(zoom);
}

function createSimulation(width: number, height: number) {
  return d3
    .forceSimulation<TagNode>(nodes.value)
    .force(
      'link',
      d3
        .forceLink<TagNode, TagLink>(links.value)
        .id((d) => d.id)
        .distance(GRAPH_CONFIG.forces.linkDistance)
        .strength(GRAPH_CONFIG.forces.linkStrength),
    )
    .force(
      'charge',
      d3.forceManyBody<TagNode>().strength(GRAPH_CONFIG.forces.chargeStrength),
    )
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'collision',
      d3
        .forceCollide<TagNode>()
        .radius(
          (d) => getNodeRadius(d.count) + GRAPH_CONFIG.forces.collisionPadding,
        ),
    );
}

function createLinks(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  return g
    .append('g')
    .selectAll('line')
    .data(links.value)
    .join('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', GRAPH_CONFIG.link.opacity)
    .attr('stroke-width', (d) => Math.sqrt(d.value));
}

function setupDragBehavior(simulation: d3.Simulation<TagNode, undefined>) {
  return d3
    .drag<SVGGElement, TagNode>()
    .on('start', (event, d) => {
      if (!event.active)
        simulation.alphaTarget(GRAPH_CONFIG.animation.alphaTarget).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

function createNodes(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  simulation: d3.Simulation<TagNode, undefined>,
) {
  const nodeGroups = g
    .append('g')
    .selectAll<SVGGElement, TagNode>('g')
    .data(nodes.value)
    .join('g')
    .call(setupDragBehavior(simulation));

  nodeGroups
    .append('circle')
    .attr('r', (d) => getNodeRadius(d.count))
    .attr('fill', (d) => getCategoryColor(d.category))
    .attr('stroke', '#fff')
    .attr('stroke-width', GRAPH_CONFIG.node.strokeWidth)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      event.stopPropagation();
      emit('tag-click', d.tag);
    })
    .on('mouseover', function () {
      d3.select(this)
        .transition()
        .duration(GRAPH_CONFIG.animation.duration)
        .attr('stroke-width', GRAPH_CONFIG.node.strokeWidthHover)
        .style('filter', 'brightness(1.2)');
    })
    .on('mouseout', function () {
      d3.select(this)
        .transition()
        .duration(GRAPH_CONFIG.animation.duration)
        .attr('stroke-width', GRAPH_CONFIG.node.strokeWidth)
        .style('filter', 'none');
    });

  nodeGroups
    .append('text')
    .text((d) => d.tag)
    .attr('font-size', (d) =>
      Math.max(GRAPH_CONFIG.label.minFontSize, getNodeRadius(d.count) / 2),
    )
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('fill', '#fff')
    .attr('pointer-events', 'none')
    .style('user-select', 'none')
    .style('font-weight', '600')
    .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)');

  nodeGroups
    .append('text')
    .text((d) => d.count)
    .attr('font-size', GRAPH_CONFIG.label.badgeFontSize)
    .attr('text-anchor', 'middle')
    .attr('dy', (d) => getNodeRadius(d.count) + 12)
    .attr('fill', 'currentColor')
    .attr('opacity', 0.7)
    .attr('pointer-events', 'none')
    .style('user-select', 'none')
    .style('font-weight', '600');

  nodeGroups.append('title').text((d) => createTooltipText(d));

  return nodeGroups;
}

function updatePositions(
  link: d3.Selection<SVGLineElement, TagLink, SVGGElement, unknown>,
  node: d3.Selection<SVGGElement, TagNode, SVGGElement, unknown>,
) {
  link
    .attr('x1', (d) => (d.source as TagNode).x!)
    .attr('y1', (d) => (d.source as TagNode).y!)
    .attr('x2', (d) => (d.target as TagNode).x!)
    .attr('y2', (d) => (d.target as TagNode).y!);

  node.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

function initGraph() {
  if (!svgRef.value || !nodes.value.length) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  const g = svg.append('g');

  setupZoom(svg, g);

  const simulation = createSimulation(props.width, props.height);
  const link = createLinks(g);
  const node = createNodes(g, simulation);

  simulation.on('tick', () => updatePositions(link, node));
}

onMounted(initGraph);

watch(() => props.tags, initGraph, { deep: true });
</script>

<style scoped>
.tag-network-graph {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 8px;
}

.tag-network-graph svg {
  display: block;
}
</style>
