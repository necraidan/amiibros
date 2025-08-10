import { Routes } from '@angular/router';
import { AmiibosComponent } from './features/amiibos/amiibos';

export const routes: Routes = [
  { path: '', component: AmiibosComponent },
  { path: '**', redirectTo: '' },
];
