import type { Repository } from '.';

function attachRepositoryIdToActivities(repository: Repository) {
  repository.structure.forEach((it) => it.repositoryId = repository.id);
  return repository;
}

export default (repository: Repository) => {
  const processors = [
    attachRepositoryIdToActivities,
  ];
  processors.forEach((f) => f(repository));
  return repository;
};
