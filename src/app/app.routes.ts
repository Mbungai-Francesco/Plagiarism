import { Routes } from '@angular/router';
import { UploadComponent } from './pages/upload/upload.component';
import { ResultComponent } from './pages/result/result.component';
import { PlagiarismDetectionComponent } from './plagiarism-detection/plagiarism-detection.component';

export const routes: Routes = [
  {
    path: '',
    component: UploadComponent
  },
  {
    path: 'result',
    component: ResultComponent
  },
  {
      path: 'test',
      component: PlagiarismDetectionComponent
  }
];
