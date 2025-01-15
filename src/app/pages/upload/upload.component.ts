import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { LucideAngularModule, Cloudy } from 'lucide-angular'

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [ ButtonModule, LucideAngularModule ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {

  readonly icons = { Cloudy }

  openFileExplorer(fileType: 'image' | 'pdf') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileType === 'image' ? 'image/*' : 'pdf/*';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      // Handle file here
    };

    input.click();
  }
}
