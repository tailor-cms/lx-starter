// Mock for @tailor-cms/garment package to avoid ESM chalk dependency
class MockGarment {
  constructor() {}

  async getSignedUrl() {
    return 'https://mock-signed-url.example.com';
  }

  async getObjectMetadata() {
    return { lastModified: new Date(), size: 0 };
  }

  getCatalog() {
    return new MockCatalogCollection();
  }
}

class MockCatalogCollection {
  constructor() {
    this.repositories = [];
  }

  async load() {
    return this.repositories;
  }
}

class MockRepository {
  constructor() {
    this.id = 'mock-repo';
    this.name = 'Mock Repository';
  }

  async load() {
    return this;
  }
}

class MockContentGraph {
  constructor() {}

  async load() {
    return this;
  }

  findNode() {
    return null;
  }
}

class MockTailorContent {
  constructor() {}

  async init() {
    return this;
  }

  async loadContent() {
    return null;
  }
}

module.exports = {
  Garment: MockGarment,
  CatalogCollection: MockCatalogCollection,
  Repository: MockRepository,
  ContentGraph: MockContentGraph,
  TailorContent: MockTailorContent,
};
