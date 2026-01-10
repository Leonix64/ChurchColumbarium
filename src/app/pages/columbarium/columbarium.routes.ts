import { Routes } from "@angular/router";
import { CustomersListPage } from "./customers/list/customers-list.page";
import { CustomersDetailPage } from "./customers/detail/customers-detail.page";
import { NichesGridPage } from "./niches/grid/niches-grid.page";
import { SalesListPage } from "./sales/list/sales-list.page";
import { SaleCreatePage } from "./sales/create/sale-create.page";
import { StatsPage } from "./stats/stats.page";

export const columbariumRoutes: Routes = [
    {
        path: 'customers',
        loadComponent: () => import('./customers/list/customers-list.page').then(m => m.CustomersListPage)

    },
    {
        path: 'customers/create',
        loadComponent: () => import('./customers/form/customers-form.page').then(m => m.CustomersFormPage)
    },
    {
        path: 'customers/:id',
        loadComponent: () => import('./customers/detail/customers-detail.page').then(m => m.CustomersDetailPage)
    },
    {
        path: 'customers/:id/edit',
        loadComponent: () => import('./customers/form/customers-form.page').then(m => m.CustomersFormPage)
    },
    {
        path: 'niches',
        loadComponent: () => import('./niches/grid/niches-grid.page').then(m => m.NichesGridPage)
    },
    {
        path: 'niches/module/:module/:section',
        loadComponent: () => import('./niches/detail/niches-detail.page').then(m => m.NichesDetailPage)
    },
    {
        path: 'sales',
        loadComponent: () => import('./sales/list/sales-list.page').then(m => m.SalesListPage)
    },
    {
        path: 'sales/create',
        loadComponent: () => import('./sales/create/sale-create.page').then(m => m.SaleCreatePage)
    },
    {
        path: 'sales/:id',
        loadComponent: () => import('./sales/detail/sale-detail.page').then(m => m.SaleDetailPage)
    },
    {
        path: 'sales/:id/payment',
        loadComponent: () => import('./sales/payment/payment-register.page').then(m => m.PaymentRegisterPage)
    },
    {
        path: 'stats',
        loadComponent: () => import('./stats/stats.page').then(m => m.StatsPage)
    },
    {
        path: '',
        redirectTo: 'customers',
        pathMatch: 'full'
    }
];
