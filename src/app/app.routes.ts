import { Routes } from '@angular/router';
import { PlagiarismDetectionComponent } from './plagiarism-detection/plagiarism-detection.component';

export const routes: Routes = [
{   
    path: '',
    redirectTo: '/test',
    pathMatch: 'full'
},
{
    path: 'test',
    component: PlagiarismDetectionComponent
}
];
