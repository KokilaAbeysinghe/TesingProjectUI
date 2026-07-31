import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();

  pageChange = output<number>();

  readonly #maxVisiblePages = 5;

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= this.#maxVisiblePages) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    let start = Math.max(1, current - Math.floor(this.#maxVisiblePages / 2));
    let end = start + this.#maxVisiblePages - 1;

    if (end > total) {
      end = total;
      start = end - this.#maxVisiblePages + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  selectPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }

    this.pageChange.emit(page);
  }

  goToPreviousPage(): void {
    this.selectPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.selectPage(this.currentPage() + 1);
  }
}
