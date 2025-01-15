import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

interface ComparisonResult {
  text1: string;
  text2: string;
  similarity: number;
  matchType: 'Exact' | 'High' | 'Moderate' | 'Low';
  matches: Array<{start1: number, end1: number, start2: number, end2: number}>;
}

@Component({
  selector: 'app-plagiarism-detection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plagiarism-detection.component.html',
  styleUrl: './plagiarism-detection.component.css'
})
export class PlagiarismDetectionComponent {
  private documents: Map<string, string> = new Map();
  fileList: string[] = [];
  results: ComparisonResult[] = [];

  async onFileSelect(event: any) {
    const files: FileList = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) return;
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (this.fileList.filter(name => name === file.name).length === 0) {
        this.fileList.push(file.name);
      }
      // const text = await this.readFile(file);
      // console.log(text);
      let text;
      try {
        switch (extension) {
          case 'txt':
            text = await this.processTxt(file);
            break;
          case 'pdf':
            text = await this.processPdf(file);
            break;
          case 'docx':
            text = await this.processDocx(file);
            break;
          default:
            alert('Unsupported file type');
        }
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Failed to process the file.');
      }
      if (text) {
        console.log(text);
        this.documents.set(file.name, text);
      }
    }
  }

  openFileExplorer(fileType: 'image' | 'pdf') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileType === 'image' ? 'image/*' : 'pdf/*';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
     this.processPdf(file).then((text)=>{
      console.log(text)
     })
      // Handle file here
    };

    input.click();
  }

  async processTxt(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => resolve(event.target.result);
      reader.onerror = () => reject('Error reading TXT file');
      reader.readAsText(file);
    });
  }

  // Process .pdf files
  async processPdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      return text;
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error('Failed to process PDF file.');
    }
  }

  // Process .docx files
  async processDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  analyze() {
    this.results = [];
    const documents = Array.from(this.documents.entries());
    
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const [name1, text1] = documents[i];
        const [name2, text2] = documents[j];
        
        const similarity = this.calculateSimilarity(text1, text2);
        const matchType = this.categorizeMatch(similarity);
        const matches = this.findMatches(text1, text2);
        
        this.results.push({
          text1: name1,
          text2: name2,
          similarity,
          matchType,
          matches
        });
      }
    }
    
    this.results.sort((a, b) => b.similarity - a.similarity);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Implement Levenshtein distance or other string matching algorithm
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (2.0 * commonWords.length) / (words1.length + words2.length) * 100;
    
    return similarity;
  }

  private findMatches(text1: string, text2: string) {
    const matches: Array<{start1: number, end1: number, start2: number, end2: number}> = [];
    
    // Implement sliding window or other matching algorithm
    const window = 5; // minimum match length
    for (let i = 0; i < text1.length - window; i++) {
      const pattern = text1.substr(i, window);
      let pos = text2.indexOf(pattern);
      
      while (pos >= 0) {
        // Extend match as far as possible
        let matchLength = window;
        while (i + matchLength < text1.length && 
               pos + matchLength < text2.length && 
               text1[i + matchLength] === text2[pos + matchLength]) {
          matchLength++;
        }
        
        if (matchLength >= window) {
          matches.push({
            start1: i,
            end1: i + matchLength,
            start2: pos,
            end2: pos + matchLength
          });
        }
        pos = text2.indexOf(pattern, pos + 1);
      }
    }
    
    return matches;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
               .replace(/[^\w\s]/g, '')
               .split(/\s+/)
               .filter(word => word.length > 3);
  }

  private categorizeMatch(similarity: number): 'Exact' | 'High' | 'Moderate' | 'Low' {
    if (similarity > 90) return 'Exact';
    if (similarity > 70) return 'High';
    if (similarity > 50) return 'Moderate';
    return 'Low';
  }

  getMatchClass(similarity: number): string {
    const matchType = this.categorizeMatch(similarity);
    return `match-${matchType.toLowerCase()}`;
  }
}