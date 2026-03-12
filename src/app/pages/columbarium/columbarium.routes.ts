import { Routes } from "@angular/router";

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
        loadComponent: () => import('./niche/grid/niches-grid.page').then(m => m.NichesGridPage)
    },
    {
        path: 'niches/manage',
        loadComponent: () => import('./niche/manage/niches-manage.page').then(m => m.NichesManagePage)
    },
    {
        path: 'niches/disabled',
        loadComponent: () => import('./niche/disabled/niches-disabled.page').then(m => m.NichesDisabledPage)
    },
    {
        path: 'niches/module/:module/:section',
        loadComponent: () => import('./niche/detail/niches-detail.page').then(m => m.NichesDetailPage)
    },
    {
        path: 'niches/:id',
        loadComponent: () => import('./niche/detail/niche-detail.page').then(m => m.NicheDetailPage)
    },
    {
        path: 'sales',
        loadComponent: () => import('./sale/list/sales-list.page').then(m => m.SalesListPage)
    },
    {
        path: 'sales/create',
        loadComponent: () => import('./sale/create/sale-create.page').then(m => m.SaleCreatePage)
    },
    {
        path: 'sales/:id',
        loadComponent: () => import('./sale/detail/sale-detail.page').then(m => m.SaleDetailPage)
    },
    {
        path: 'stats',
        loadComponent: () => import('./stats/stats.page').then(m => m.StatsPage)
    },
    {
        path: 'audit',
        loadComponent: () => import('./audit/audit-list.page').then(m => m.AuditListPage)
    },
    {
        path: 'audit/reports',
        loadComponent: () => import('./audit/report/audit-report.page').then(m => m.AuditReportPage)
    },
    {
        path: 'audit/user/:userId',
        loadComponent: () => import('./audit/user-history/user-history.page').then(m => m.UserHistoryPage)
    },
    {
        path: 'succession/wizard/:nicheId',
        loadComponent: () => import('./succession/wizard/succession-wizard.page').then(m => m.SuccessionWizardPage)
    },
    {
        path: '',
        redirectTo: 'customers',
        pathMatch: 'full'
    }
];
