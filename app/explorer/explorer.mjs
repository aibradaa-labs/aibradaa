/**
 * Explorer Module
 * Browse and filter top 35 laptops with advanced sorting
 */

import { apiClient } from '../shared/utils/api.mjs';
import { storage } from '../shared/utils/storage.mjs';

export class Explorer {
  constructor() {
    this.laptops = [];
    this.filteredLaptops = [];
    this.filters = this.getDefaultFilters();
    this.sortBy = 'relevance';
    this.sortOrder = 'desc';
    this.currentPage = 1;
    this.itemsPerPage = 12;
  }

  /**
   * Get default filter state
   */
  getDefaultFilters() {
    return {
      priceRange: [0, 99999],
      brands: [],
      cpuType: [], // ['Intel', 'AMD', 'Apple']
      gpuType: [], // ['NVIDIA', 'AMD', 'Integrated', 'Apple']
      ramMin: 0,
      storageMin: 0,
      weightMax: 99,
      batteryMin: 0,
      useCase: [], // ['gaming', 'work', 'creative', 'student']
    };
  }

  /**
   * Load laptops from API or cache
   */
  async loadLaptops() {
    try {
      // Check cache first
      const cached = await storage.getCache('laptops-top35');
      if (cached) {
        this.laptops = cached;
        this.applyFilters();
        return this.laptops;
      }

      // Fetch from API
      const response = await apiClient.get('/api/laptops/top35');
      this.laptops = response.data || [];

      // Cache for 1 hour
      await storage.setCache('laptops-top35', this.laptops, 3600000);

      this.applyFilters();
      return this.laptops;
    } catch (error) {
      console.error('Failed to load laptops:', error);
      throw error;
    }
  }

  /**
   * Set filter values
   */
  setFilter(filterName, value) {
    if (!(filterName in this.filters)) {
      throw new Error(`Unknown filter: ${filterName}`);
    }

    this.filters[filterName] = value;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    this.filters = this.getDefaultFilters();
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Apply all active filters
   */
  applyFilters() {
    this.filteredLaptops = this.laptops.filter(laptop => {
      // Price range
      if (laptop.price < this.filters.priceRange[0] || laptop.price > this.filters.priceRange[1]) {
        return false;
      }

      // Brands
      if (this.filters.brands.length > 0 && !this.filters.brands.includes(laptop.brand)) {
        return false;
      }

      // CPU type
      if (this.filters.cpuType.length > 0) {
        const hasCpuType = this.filters.cpuType.some(type =>
          laptop.specs?.cpu?.toLowerCase().includes(type.toLowerCase())
        );
        if (!hasCpuType) return false;
      }

      // GPU type
      if (this.filters.gpuType.length > 0) {
        const hasGpuType = this.filters.gpuType.some(type => {
          if (type === 'Integrated') {
            return !laptop.specs?.gpu || laptop.specs.gpu.toLowerCase().includes('integrated');
          }
          return laptop.specs?.gpu?.toLowerCase().includes(type.toLowerCase());
        });
        if (!hasGpuType) return false;
      }

      // RAM minimum
      if (this.filters.ramMin > 0 && (laptop.specs?.ram || 0) < this.filters.ramMin) {
        return false;
      }

      // Storage minimum
      if (this.filters.storageMin > 0 && (laptop.specs?.storage || 0) < this.filters.storageMin) {
        return false;
      }

      // Weight maximum
      if (this.filters.weightMax < 99 && (laptop.specs?.weight || 0) > this.filters.weightMax) {
        return false;
      }

      // Battery minimum
      if (this.filters.batteryMin > 0 && (laptop.specs?.batteryLife || 0) < this.filters.batteryMin) {
        return false;
      }

      // Use case
      if (this.filters.useCase.length > 0) {
        const matchesUseCase = this.filters.useCase.some(useCase =>
          (laptop.tags || []).includes(useCase)
        );
        if (!matchesUseCase) return false;
      }

      return true;
    });

    this.applySorting();
  }

  /**
   * Set sort criteria
   */
  setSortBy(sortBy, order = 'desc') {
    this.sortBy = sortBy;
    this.sortOrder = order;
    this.applySorting();
  }

  /**
   * Apply sorting to filtered laptops
   */
  applySorting() {
    const sortFunctions = {
      relevance: (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
      price: (a, b) => a.price - b.price,
      performance: (a, b) => (b.performanceScore || 0) - (a.performanceScore || 0),
      battery: (a, b) => (b.specs?.batteryLife || 0) - (a.specs?.batteryLife || 0),
      weight: (a, b) => (a.specs?.weight || 99) - (b.specs?.weight || 99),
      value: (a, b) => (b.valueScore || 0) - (a.valueScore || 0),
      newest: (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0),
    };

    const sortFn = sortFunctions[this.sortBy] || sortFunctions.relevance;

    this.filteredLaptops.sort(sortFn);

    // Reverse if ascending order
    if (this.sortOrder === 'asc') {
      this.filteredLaptops.reverse();
    }
  }

  /**
   * Get paginated results
   */
  getPage(pageNumber = this.currentPage) {
    this.currentPage = pageNumber;
    const start = (pageNumber - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    return {
      laptops: this.filteredLaptops.slice(start, end),
      currentPage: pageNumber,
      totalPages: Math.ceil(this.filteredLaptops.length / this.itemsPerPage),
      totalItems: this.filteredLaptops.length,
      hasNext: end < this.filteredLaptops.length,
      hasPrev: pageNumber > 1,
    };
  }

  /**
   * Get all filtered laptops (no pagination)
   */
  getAllFiltered() {
    return this.filteredLaptops;
  }

  /**
   * Get filter summary
   */
  getFilterSummary() {
    const activeFilters = [];

    if (this.filters.priceRange[0] > 0 || this.filters.priceRange[1] < 99999) {
      activeFilters.push(`Price: RM ${this.filters.priceRange[0]} - ${this.filters.priceRange[1]}`);
    }

    if (this.filters.brands.length > 0) {
      activeFilters.push(`Brands: ${this.filters.brands.join(', ')}`);
    }

    if (this.filters.cpuType.length > 0) {
      activeFilters.push(`CPU: ${this.filters.cpuType.join(', ')}`);
    }

    if (this.filters.gpuType.length > 0) {
      activeFilters.push(`GPU: ${this.filters.gpuType.join(', ')}`);
    }

    if (this.filters.ramMin > 0) {
      activeFilters.push(`RAM ≥ ${this.filters.ramMin}GB`);
    }

    if (this.filters.storageMin > 0) {
      activeFilters.push(`Storage ≥ ${this.filters.storageMin}GB`);
    }

    if (this.filters.weightMax < 99) {
      activeFilters.push(`Weight ≤ ${this.filters.weightMax}kg`);
    }

    if (this.filters.batteryMin > 0) {
      activeFilters.push(`Battery ≥ ${this.filters.batteryMin}h`);
    }

    if (this.filters.useCase.length > 0) {
      activeFilters.push(`Use: ${this.filters.useCase.join(', ')}`);
    }

    return {
      count: activeFilters.length,
      filters: activeFilters,
      resultCount: this.filteredLaptops.length,
    };
  }

  /**
   * Get available filter options (dynamic based on current data)
   */
  getFilterOptions() {
    const brands = [...new Set(this.laptops.map(l => l.brand))].sort();
    const cpuTypes = [...new Set(this.laptops.map(l => {
      const cpu = l.specs?.cpu || '';
      if (cpu.includes('Intel')) return 'Intel';
      if (cpu.includes('AMD') || cpu.includes('Ryzen')) return 'AMD';
      if (cpu.includes('M1') || cpu.includes('M2') || cpu.includes('M3') || cpu.includes('M4')) return 'Apple';
      return null;
    }).filter(Boolean))];

    const gpuTypes = ['NVIDIA', 'AMD', 'Integrated', 'Apple'];

    return {
      brands,
      cpuTypes,
      gpuTypes,
      ramOptions: [4, 8, 16, 32, 64],
      storageOptions: [128, 256, 512, 1024, 2048],
      weightOptions: [1.0, 1.5, 2.0, 2.5, 3.0],
      batteryOptions: [4, 6, 8, 10, 12, 15],
      useCaseOptions: [
        { value: 'gaming', label: 'Gaming' },
        { value: 'work', label: 'Work & Productivity' },
        { value: 'creative', label: 'Creative Work' },
        { value: 'student', label: 'Student' },
        { value: 'casual', label: 'Casual Use' },
      ],
    };
  }

  /**
   * Quick search by text
   */
  search(query) {
    if (!query || query.trim() === '') {
      this.applyFilters();
      return;
    }

    const searchTerm = query.toLowerCase().trim();

    this.filteredLaptops = this.filteredLaptops.filter(laptop => {
      const searchableText = [
        laptop.brand,
        laptop.model,
        laptop.specs?.cpu,
        laptop.specs?.gpu,
        ...(laptop.tags || []),
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }
}

export default Explorer;
