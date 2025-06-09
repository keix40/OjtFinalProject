import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BrandService } from '../brand.service';
import { CategoryService } from '../category.service';
import { Router } from '@angular/router';
import { Category, CategoryDTO } from '../category';
import { Brand } from '../brand';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-category',
  standalone: false,
  templateUrl: './create-category.component.html',
  styleUrl: './create-category.component.css'
})
export class CreateCategoryComponent {
  categoryNames: string[] = ['']; // Multiple category names
  selectedParentCategoryId?: number;

  selectedBrandId: number = 0;
  newBrandName: string = '';
  brandOption: 'old' | 'new' | 'none' = 'old';

  brands: Brand[] = [];
  categories: Category[] = [];

  brandId: number | null = null;
  brandName: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private brandService: BrandService,
    private cateService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBrand();
    this.loadCategory();
  }

  loadBrand() {
    this.brandService.getAllBrand().subscribe({
      next: (data) => (this.brands = data),
      error: (err) => console.error('Brand load error:', err)
    });
  }

  loadCategory() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Category load error:', err)
    });
  }

  addCategoryField() {
    this.categoryNames.push('');
  }
  
  removeCategoryField(index: number) {
    if (this.categoryNames.length > 1) {
      this.categoryNames.splice(index, 1);
    }
  }

  createCategory(form: NgForm) {
    if (form.invalid) return;
    if (this.brandOption === 'old') {
      this.brandId = this.selectedBrandId;
      this.brandName = null;
    } else if (this.brandOption === 'none') {
      this.brandId = 0;
      this.brandName = null;
    } else {
      this.brandId = null;
      this.brandName = this.newBrandName.trim();
    }

      const uniqueNames = Array.from(new Set(
        this.categoryNames
          .map(name => name.trim())
          .filter(name => name.length > 0)
      ));
  
      if (uniqueNames.length === 0) return;

    const requests = this.categoryNames.map((name) => {
      const dto: CategoryDTO = {
        cateNames: uniqueNames,
        brandId: this.brandId ?? 0,
        brandName: this.brandName ?? '',
        parentId: this.selectedParentCategoryId || undefined
      };

      return this.cateService.createCategory(dto);
    });

    Promise.all(requests.map(req => req.toPromise()))
      .then((results) => {
        console.log('All categories created:', results);
        this.activeModal.close(results);
        this.router.navigate(['/product']);
      })
      .catch((err) => {
        console.error('Error creating categories:', err);
      });
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
  
}
