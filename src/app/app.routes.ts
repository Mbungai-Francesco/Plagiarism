import { Routes } from '@angular/router';
import { UploadComponent } from './pages/upload/upload.component';
import { ResultComponent } from './pages/result/result.component';

export const routes: Routes = [
  {
    path: '',
    component: UploadComponent
  },
  {
    path: 'result',
    component: ResultComponent
  }
];
