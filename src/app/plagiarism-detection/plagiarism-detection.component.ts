import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
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

  constructor(){}

  async onFileSelect(event: any) {
    const files: FileList = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) return;
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (this.fileList.filter(name => name === file.name).length === 0) {
        this.fileList.push(file.name);
      }

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
        this.documents.set(file.name, text);
      }
    }
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

    // const ngramSimilarity = this.NGram(text1,text2)
    // console.log("ngram ",ngramSimilarity)
    const cosineSimilarity = this.cosineSimilarity(text1,text2)
    console.log("cosine",cosineSimilarity);

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
    const tokens = text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 3);
    console.log("done")
    return tokens;
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

  // Method to create n-grams from text
  private generateNGrams(tokens: string[], n: number): string[] {
    const nGrams: string[] = [];

    for (let i = 0; i <= tokens.length - n; i++) {
      const nGram = tokens.slice(i, i + n).join(' ');
      nGrams.push(nGram);
    }
    console.log(nGrams);

    return nGrams;
  }

  // Method to calculate Jaccard similarity between two sets of n-grams
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size; // Jaccard similarity formula
  }

  private NGram(text1: string, text2: string): number{
    const n = 4;
    const nGrams1 = this.generateNGrams(this.tokenize(text1), n);
    const nGrams2 = this.generateNGrams(this.tokenize(text2), n);


    const set1 = new Set(nGrams1)
    const set2 = new Set(nGrams2)

    const similar = this.jaccardSimilarity(set1,set2)
    return similar;
  }


  private calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const totalTokens = tokens.length;
    console.log("total tokens",totalTokens)

    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });

    // Normalize term frequency (TF)
    tf.forEach((value, key) => {
      tf.set(key, value / totalTokens);
    });

    return tf;
  }

  // Calculate IDF (Inverse Document Frequency) for the whole corpus
  private calculateIDF(corpus: string[]): Map<string, number> {
    const idf = new Map<string, number>();
    const totalDocuments = corpus.length;
    console.log("total documents",totalDocuments)
    console.log("corpus",corpus)
  
    corpus.forEach(document => {
      console.log("document",document)
      const tokens = new Set(this.tokenize(document));
      if (tokens.size === 0) return; // Skip empty documents or documents with only stop words
      console.log("tokens",tokens)

      tokens.forEach(token => {
        console.log("token",token)
        if (!idf.has(token)) {
          const count = corpus.filter(doc => doc.includes(token)).length;
          console.log("count",count)
          idf.set(token, Math.log(totalDocuments / count));
        }
      });
    });
  
    return idf;
  }


  // Convert document to TF-IDF vector
  private convertToTFIDF(tokens: string[], idf: Map<string, number>): Map<string, number> {
    const tf = this.calculateTF(tokens);
    const tfidf = new Map<string, number>();
  
    tf.forEach((value, key) => {
      const idfValue = idf.get(key) || 0;
      tfidf.set(key, value * idfValue);
    });
  
    return tfidf;
  }

  private dotProduct(vector1: number[], vector2: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
    }
    return dotProduct;
  }

  // Calculate the magnitude (or norm) of a vector
  private magnitude(vector: number[]): number {
    let sumOfSquares = 0;
    for (let i = 0; i < vector.length; i++) {
      sumOfSquares += vector[i] * vector[i];
    }
    return Math.sqrt(sumOfSquares);
  }

  private cosineSimilarity(doc1: string, doc2: string): number{
    const corpus = [doc1.toLowerCase(), doc2.toLowerCase()];
    const idf = this.calculateIDF(corpus);
    console.log("idf", idf);

    const tfidf1 = this.convertToTFIDF(this.tokenize(doc1), idf);
    console.log("tfidf1", tfidf1);
    const tfidf2 = this.convertToTFIDF(this.tokenize(doc2), idf);
    console.log("tfidf2", tfidf2);

    const vector1 = Array.from(tfidf1.values());
    console.log("vector1", vector1);
    const vector2 = Array.from(tfidf2.values());
    console.log("vector2", vector2);

    const dotProd = this.dotProduct(vector1, vector2);
    console.log("dotproduct", dotProd);

    const magnitude1 = this.magnitude(vector1);
    console.log("magnitude1", magnitude1);
    const magnitude2 = this.magnitude(vector2);
    console.log("magnitude2", magnitude2);

    if(magnitude1*magnitude2 === 0){
      return 0;
    }

    return dotProd / (magnitude1 * magnitude2);
  }
}