import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

export interface ParsedResume {
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  experience_years: number;
}

// Common technical skills list for extraction
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy',
  'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Sass',
  'REST', 'GraphQL', 'gRPC', 'WebSocket',
  'Linux', 'Bash', 'Shell', 'Terraform', 'Ansible',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'Agile', 'Scrum', 'DevOps', 'MLOps', 'DataOps'
];

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error}`);
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error}`);
  }
}

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  
  if (ext === '.pdf') {
    return extractTextFromPDF(buffer);
  } else if (ext === '.docx') {
    return extractTextFromDOCX(buffer);
  } else if (ext === '.txt') {
    return buffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

export function parseResume(rawText: string): ParsedResume {
  // Extract email
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const emailMatches = rawText.match(emailRegex);
  const email = emailMatches ? emailMatches[0] : null;
  
  // Extract phone
  const phoneRegex = /\+?\d{10,}/g;
  const phoneMatches = rawText.match(phoneRegex);
  const phone = phoneMatches ? phoneMatches[0] : null;
  
  // Extract name (assume first line or first capitalized words)
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const name = extractName(lines);
  
  // Extract skills
  const skills = extractSkills(rawText);
  
  // Extract experience and calculate years
  const experience = extractExperience(rawText);
  const experienceYears = calculateExperienceYears(rawText);
  
  // Extract education
  const education = extractEducation(rawText);
  
  // Generate summary (first few sentences or summary section)
  const summary = extractSummary(rawText);
  
  return {
    name,
    email,
    phone,
    skills,
    experience,
    education,
    summary,
    experience_years: experienceYears,
  };
}

function extractName(lines: string[]): string {
  // Try to find name in first few lines
  for (const line of lines.slice(0, 5)) {
    // Skip email/phone lines
    if (line.includes('@') || /\d{10}/.test(line)) continue;
    
    // Name is usually title case and not too long
    if (line.length < 50 && /^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(line)) {
      return line;
    }
  }
  
  // Fallback to first non-empty line
  return lines[0] || 'Unknown';
}

function extractSkills(text: string): string[] {
  const foundSkills = new Set<string>();
  const lowerText = text.toLowerCase();
  
  for (const skill of COMMON_SKILLS) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }
  
  // Also look for skills in "Skills:" section
  const skillsSectionRegex = /skills?:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\nexperience|\neducation|$)/i;
  const skillsMatch = text.match(skillsSectionRegex);
  
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    const skillWords = skillsText.split(/[,;\n]+/).map(s => s.trim());
    
    for (const word of skillWords) {
      if (word.length > 2 && word.length < 30) {
        foundSkills.add(word);
      }
    }
  }
  
  return Array.from(foundSkills);
}

function extractExperience(text: string): string[] {
  const experiences: string[] = [];
  
  // Look for experience section
  const expRegex = /experience:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\neducation|\nskills|$)/i;
  const expMatch = text.match(expRegex);
  
  if (expMatch) {
    const expText = expMatch[1];
    // Split by job entries (usually marked by dates or bullet points)
    const entries = expText.split(/\n(?=\d{4}|•|-|\*)/);
    
    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length > 10) {
        experiences.push(trimmed);
      }
    }
  }
  
  return experiences;
}

function calculateExperienceYears(text: string): number {
  // Look for year ranges like "2018-2021" or "2018 - present"
  const yearRangeRegex = /(\d{4})\s*-\s*(\d{4}|present|current)/gi;
  const matches = Array.from(text.matchAll(yearRangeRegex));
  
  let totalMonths = 0;
  const currentYear = new Date().getFullYear();
  
  for (const match of matches) {
    const startYear = parseInt(match[1]);
    const endYear = match[2].match(/\d{4}/) ? parseInt(match[2]) : currentYear;
    
    totalMonths += (endYear - startYear) * 12;
  }
  
  return Math.round(totalMonths / 12);
}

function extractEducation(text: string): string[] {
  const education: string[] = [];
  
  // Look for education section
  const eduRegex = /education:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\nexperience|\nskills|$)/i;
  const eduMatch = text.match(eduRegex);
  
  if (eduMatch) {
    const eduText = eduMatch[1];
    const entries = eduText.split(/\n(?=\d{4}|•|-|\*)/);
    
    for (const entry of entries) {
      const trimmed = entry.trim();
      if (trimmed.length > 10) {
        education.push(trimmed);
      }
    }
  }
  
  return education;
}

function extractSummary(text: string): string {
  // Look for summary/objective section
  const summaryRegex = /(summary|objective|profile):?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\nexperience|\neducation|$)/i;
  const summaryMatch = text.match(summaryRegex);
  
  if (summaryMatch) {
    return summaryMatch[2].trim().substring(0, 500);
  }
  
  // Fallback to first paragraph
  const paragraphs = text.split('\n\n');
  for (const para of paragraphs) {
    if (para.length > 50 && para.length < 1000) {
      return para.trim().substring(0, 500);
    }
  }
  
  return text.substring(0, 500);
}

export async function extractFilesFromZip(zipBuffer: Buffer): Promise<{ filename: string; buffer: Buffer }[]> {
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    const files: { filename: string; buffer: Buffer }[] = [];
    
    for (const entry of entries) {
      if (!entry.isDirectory) {
        const ext = path.extname(entry.entryName).toLowerCase();
        if (['.pdf', '.docx', '.txt'].includes(ext)) {
          files.push({
            filename: entry.entryName,
            buffer: entry.getData(),
          });
        }
      }
    }
    
    return files;
  } catch (error) {
    throw new Error(`Failed to extract ZIP: ${error}`);
  }
}
