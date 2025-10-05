import bcrypt from 'bcrypt';
import pool from './pool';
import { generateEmbedding } from '../utils/embeddings';

const sampleResumes = [
  {
    filename: 'john_doe_senior_engineer.pdf',
    rawText: `John Doe
john.doe@email.com
+1234567890

SUMMARY
Senior Software Engineer with 6 years of experience in full-stack development. Specialized in building scalable web applications using modern technologies.

EXPERIENCE
Senior Software Engineer - Tech Corp (2020-Present)
- Led development of microservices architecture using Node.js and Docker
- Implemented CI/CD pipelines with Jenkins and Kubernetes
- Managed team of 4 junior developers

Software Engineer - StartupXYZ (2018-2020)
- Built REST APIs using Python and Flask
- Worked with PostgreSQL and Redis for data storage
- Developed React frontend applications

SKILLS
JavaScript, TypeScript, Python, React, Node.js, Express, PostgreSQL, MongoDB, Docker, Kubernetes, AWS, Git

EDUCATION
Bachelor of Science in Computer Science - MIT (2018)`,
    parsedData: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1234567890',
      skills: ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Git'],
      experience_years: 6,
      experience: ['Senior Software Engineer - Tech Corp (2020-Present)', 'Software Engineer - StartupXYZ (2018-2020)'],
      education: ['Bachelor of Science in Computer Science - MIT (2018)'],
      summary: 'Senior Software Engineer with 6 years of experience in full-stack development. Specialized in building scalable web applications using modern technologies.',
    },
  },
  {
    filename: 'jane_smith_ml_engineer.pdf',
    rawText: `Jane Smith
jane.smith@email.com
+9876543210

SUMMARY
Machine Learning Engineer with PhD in Computer Science and 4 years of industry experience. Expert in deep learning and NLP.

EXPERIENCE
ML Engineer - AI Labs (2021-Present)
- Developed NLP models using TensorFlow and PyTorch
- Improved model accuracy by 25% through advanced techniques
- Published 3 research papers in top conferences

Research Scientist - University Research Lab (2019-2021)
- Conducted research in computer vision and deep learning
- Worked with large-scale datasets and GPU clusters

SKILLS
Python, TensorFlow, PyTorch, scikit-learn, Pandas, NumPy, NLP, Computer Vision, AWS, Docker, MLOps

EDUCATION
PhD in Computer Science - Stanford University (2019)
MS in Computer Science - Stanford University (2017)`,
    parsedData: {
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+9876543210',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'NLP', 'Computer Vision', 'AWS', 'Docker', 'MLOps'],
      experience_years: 4,
      experience: ['ML Engineer - AI Labs (2021-Present)', 'Research Scientist - University Research Lab (2019-2021)'],
      education: ['PhD in Computer Science - Stanford University (2019)', 'MS in Computer Science - Stanford University (2017)'],
      summary: 'Machine Learning Engineer with PhD in Computer Science and 4 years of industry experience. Expert in deep learning and NLP.',
    },
  },
  {
    filename: 'bob_wilson_fullstack.pdf',
    rawText: `Bob Wilson
bob.wilson@email.com
+5551234567

SUMMARY
Full Stack Developer with 3 years of experience building modern web applications. Passionate about clean code and user experience.

EXPERIENCE
Full Stack Developer - WebCo (2021-Present)
- Built responsive web applications using React and Node.js
- Integrated with MongoDB and REST APIs
- Implemented authentication and authorization systems

Junior Developer - TechStart (2020-2021)
- Developed frontend features using React and Tailwind CSS
- Worked with Git for version control
- Participated in Agile development process

SKILLS
JavaScript, React, Node.js, MongoDB, HTML, CSS, Tailwind, Git, REST, Express

EDUCATION
Bachelor of Science in Software Engineering - UC Berkeley (2020)`,
    parsedData: {
      name: 'Bob Wilson',
      email: 'bob.wilson@email.com',
      phone: '+5551234567',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'HTML', 'CSS', 'Tailwind', 'Git', 'REST', 'Express'],
      experience_years: 3,
      experience: ['Full Stack Developer - WebCo (2021-Present)', 'Junior Developer - TechStart (2020-2021)'],
      education: ['Bachelor of Science in Software Engineering - UC Berkeley (2020)'],
      summary: 'Full Stack Developer with 3 years of experience building modern web applications. Passionate about clean code and user experience.',
    },
  },
  {
    filename: 'alice_chen_devops.pdf',
    rawText: `Alice Chen
alice.chen@email.com
+1112223333

SUMMARY
DevOps Engineer with 5 years of experience in cloud infrastructure and automation. Expert in AWS, Kubernetes, and CI/CD pipelines.

EXPERIENCE
Senior DevOps Engineer - CloudTech (2020-Present)
- Managed AWS infrastructure serving 1M+ users
- Implemented Kubernetes clusters for containerized applications
- Built CI/CD pipelines using Jenkins and GitHub Actions
- Reduced deployment time by 60% through automation

DevOps Engineer - DataCorp (2018-2020)
- Automated infrastructure provisioning with Terraform
- Monitored systems using Prometheus and Grafana
- Managed PostgreSQL and MongoDB databases

SKILLS
AWS, Kubernetes, Docker, Terraform, Ansible, Jenkins, Python, Bash, PostgreSQL, MongoDB, Git, Linux, CI/CD

EDUCATION
Bachelor of Science in Computer Engineering - Georgia Tech (2018)`,
    parsedData: {
      name: 'Alice Chen',
      email: 'alice.chen@email.com',
      phone: '+1112223333',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Ansible', 'Jenkins', 'Python', 'Bash', 'PostgreSQL', 'MongoDB', 'Git', 'Linux', 'CI/CD'],
      experience_years: 5,
      experience: ['Senior DevOps Engineer - CloudTech (2020-Present)', 'DevOps Engineer - DataCorp (2018-2020)'],
      education: ['Bachelor of Science in Computer Engineering - Georgia Tech (2018)'],
      summary: 'DevOps Engineer with 5 years of experience in cloud infrastructure and automation. Expert in AWS, Kubernetes, and CI/CD pipelines.',
    },
  },
  {
    filename: 'michael_brown_data_scientist.pdf',
    rawText: `Michael Brown
michael.brown@email.com
+4445556666

SUMMARY
Data Scientist with 4 years of experience in statistical analysis and machine learning. Skilled in Python, R, and data visualization.

EXPERIENCE
Data Scientist - Analytics Inc (2020-Present)
- Built predictive models using machine learning algorithms
- Performed statistical analysis on large datasets
- Created dashboards and visualizations using Tableau
- Collaborated with stakeholders to drive data-driven decisions

Junior Data Analyst - FinTech Solutions (2019-2020)
- Analyzed customer data to identify trends
- Developed reports using Python and SQL
- Worked with PostgreSQL databases

SKILLS
Python, R, scikit-learn, Pandas, NumPy, Tableau, SQL, PostgreSQL, Machine Learning, Statistics, Data Visualization

EDUCATION
Master of Science in Data Science - Carnegie Mellon University (2019)
Bachelor of Science in Mathematics - UCLA (2017)`,
    parsedData: {
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+4445556666',
      skills: ['Python', 'R', 'scikit-learn', 'Pandas', 'NumPy', 'Tableau', 'SQL', 'PostgreSQL', 'Machine Learning', 'Statistics'],
      experience_years: 4,
      experience: ['Data Scientist - Analytics Inc (2020-Present)', 'Junior Data Analyst - FinTech Solutions (2019-2020)'],
      education: ['Master of Science in Data Science - Carnegie Mellon University (2019)', 'Bachelor of Science in Mathematics - UCLA (2017)'],
      summary: 'Data Scientist with 4 years of experience in statistical analysis and machine learning. Skilled in Python, R, and data visualization.',
    },
  },
];

const sampleJobs = [
  {
    title: 'Senior Backend Engineer',
    description: 'We are looking for a Senior Backend Engineer to join our team. You will be responsible for designing and implementing scalable microservices using Node.js, Python, and cloud technologies.',
    required_skills: ['Python', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    experience_required: 5,
    location: 'San Francisco, CA',
  },
  {
    title: 'Machine Learning Engineer',
    description: 'Join our AI team to build cutting-edge machine learning models. Experience with deep learning frameworks and NLP is essential.',
    required_skills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'NLP'],
    experience_required: 3,
    location: 'Remote',
  },
  {
    title: 'Full Stack Developer',
    description: 'We need a Full Stack Developer to build modern web applications. Must be proficient in React, Node.js, and databases.',
    required_skills: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'REST'],
    experience_required: 3,
    location: 'New York, NY',
  },
];

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...\n');
    
    // Create admin user
    console.log('Creating admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $3
       RETURNING id`,
      ['admin@mail.com', passwordHash, 'admin']
    );
    
    const adminId = userResult.rows[0].id;
    console.log('✓ Admin user created: admin@mail.com / admin123\n');
    
    // Create recruiter user
    const recruiterHash = await bcrypt.hash('recruiter123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      ['recruiter@mail.com', recruiterHash, 'recruiter']
    );
    console.log('✓ Recruiter user created: recruiter@mail.com / recruiter123\n');
    
    // Insert sample resumes
    console.log('Inserting sample resumes...');
    for (const resume of sampleResumes) {
      console.log(`  Processing ${resume.filename}...`);
      
      // Generate embedding
      const embedding = await generateEmbedding(resume.rawText);
      
      await client.query(
        `INSERT INTO resumes (filename, raw_text, parsed_data, embedding, uploaded_by, processing_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          resume.filename,
          resume.rawText,
          JSON.stringify(resume.parsedData),
          JSON.stringify(embedding),
          adminId,
          'completed',
        ]
      );
      
      console.log(`  ✓ ${resume.filename} inserted`);
    }
    
    console.log(`\n✓ ${sampleResumes.length} sample resumes inserted\n`);
    
    // Insert sample jobs
    console.log('Inserting sample jobs...');
    for (const job of sampleJobs) {
      console.log(`  Processing "${job.title}"...`);
      
      // Generate embedding
      const jobText = `${job.title} ${job.description} ${job.required_skills.join(' ')}`;
      const embedding = await generateEmbedding(jobText);
      
      await client.query(
        `INSERT INTO jobs (title, description, required_skills, experience_required, location, embedding, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          job.title,
          job.description,
          JSON.stringify(job.required_skills),
          job.experience_required,
          job.location,
          JSON.stringify(embedding),
          adminId,
        ]
      );
      
      console.log(`  ✓ "${job.title}" inserted`);
    }
    
    console.log(`\n✓ ${sampleJobs.length} sample jobs inserted\n`);
    
    console.log('✅ Database seeding completed successfully!\n');
    console.log('You can now:');
    console.log('  - Login with admin@mail.com / admin123');
    console.log('  - Login with recruiter@mail.com / recruiter123');
    console.log(`  - ${sampleResumes.length} resumes available for search`);
    console.log(`  - ${sampleJobs.length} jobs available for matching\n`);
    
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seed;
