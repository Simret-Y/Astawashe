import { useState } from 'react';

type CommunityCategory = {
  id: string;
  name: string;
  description: string;
  subcategories: string[];
  badge: string;
};

type Activity = {
  id: string;
  categoryId: string;
  type: 'Chat' | 'Achievement' | 'Progress';
  title: string;
  message: string;
  user: string;
};

const categories: CommunityCategory[] = [
  {
    id: 'cardiac',
    name: 'Cardiac Cases',
    description: 'Discuss heart health, recovery, and lifestyle support.',
    subcategories: ['Hypertension', 'Arrhythmia', 'Heart Surgery', 'General Cardiac'],
    badge: '❤️',
  },
  {
    id: 'cancer',
    name: 'Cancers',
    description: 'Share treatment progress, therapy tips, and emotional support.',
    subcategories: ['Breast Cancer', 'Lung Cancer', 'Leukemia', 'General Cancer'],
    badge: '🎗️',
  },
  {
    id: 'communicable',
    name: 'Communicable Diseases',
    description: 'Support groups for infections, immunity, and care routines.',
    subcategories: ['COVID-19', 'Malaria', 'Tuberculosis', 'General Infection'],
    badge: '🦠',
  },
  {
    id: 'respiratory',
    name: 'Respiratory Support',
    description: 'Talk about breathing issues, asthma, and lung health.',
    subcategories: ['Asthma', 'COPD', 'Pneumonia', 'General Respiratory'],
    badge: '🌬️',
  },
  {
    id: 'diabetes',
    name: 'Diabetes Care',
    description: 'Exchange diet tips, medication reminders, and progress.',
    subcategories: ['Type 1', 'Type 2', 'Gestational', 'General Diabetes'],
    badge: '🩸',
  },
  {
    id: 'mental',
    name: 'Mental Health',
    description: 'A safe place to talk about mood, motivation, and support.',
    subcategories: ['Anxiety', 'Depression', 'Stress', 'General Mental Health'],
    badge: '🧠',
  },
  {
    id: 'rehab',
    name: 'Rehab & Recovery',
    description: 'Discuss physical therapy, recovery milestones, and progress.',
    subcategories: ['Post-Surgery', 'Injury Rehab', 'Mobility', 'General Recovery'],
    badge: '💪',
  },
];

const activities: Activity[] = [
  {
    id: 'a1',
    categoryId: 'cardiac',
    type: 'Chat',
    title: 'Best low-sodium recipes',
    message: 'I switched to a Mediterranean diet and felt less swollen after 2 weeks.',
    user: 'Martha, 45',
  },
  {
    id: 'a2',
    categoryId: 'cancer',
    type: 'Progress',
    title: 'Finished chemo cycle 3',
    message: 'Energy levels are slowly improving and I feel more hopeful.',
    user: 'Habtamu, 34',
  },
  {
    id: 'a3',
    categoryId: 'communicable',
    type: 'Achievement',
    title: 'Negative test result!',
    message: 'After two weeks of treatment, I tested negative for TB.',
    user: 'Samuel, 52',
  },
  {
    id: 'a4',
    categoryId: 'diabetes',
    type: 'Chat',
    title: 'Best insulin timing tips',
    message: 'I started tracking carbs and my morning readings were steadier.',
    user: 'Selam, 29',
  },
  {
    id: 'a5',
    categoryId: 'mental',
    type: 'Achievement',
    title: 'Completed first therapy session',
    message: 'It was hard, but I feel supported and ready to keep going.',
    user: 'Daniel, 38',
  },
  {
    id: 'a6',
    categoryId: 'rehab',
    type: 'Progress',
    title: 'Walking 500m without pain',
    message: 'Physical therapy is paying off. My knee feels much stronger.',
    user: 'Nadia, 50',
  },
];

export default function Community() {
  const [selectedId, setSelectedId] = useState<string>('cardiac');
  const selectedCategory = categories.find((category) => category.id === selectedId) || categories[0];
  const currentActivities = activities.filter((activity) => activity.categoryId === selectedCategory.id);

  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="row g-5 align-items-center mb-5">
          <div className="col-lg-8">
            <div className="text-start mb-4">
              <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Community</h5>
              <h1 className="display-4">Patient Support Network</h1>
              <p className="lead">Join patient discussion groups, share wins, and connect by disease domain across health categories.</p>
            </div>
          </div>
          <div className="col-lg-4 text-lg-end">
            <a href="#categories" className="btn btn-outline-primary btn-lg">Browse Categories</a>
          </div>
        </div>

        <div id="categories" className="row g-4 mb-5">
          {categories.map((category) => (
            <div className="col-lg-4 col-md-6" key={category.id}>
              <button
                type="button"
                className={`border rounded p-4 w-100 text-start h-100 ${selectedId === category.id ? 'shadow border-primary bg-light' : 'bg-white'}`}
                onClick={() => setSelectedId(category.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h4 className="mb-0">{category.name}</h4>
                  <span className="fs-3">{category.badge}</span>
                </div>
                <p className="mb-3 text-muted">{category.description}</p>
                <div className="d-flex flex-wrap gap-2">
                  {category.subcategories.map((sub) => (
                    <span key={sub} className="badge bg-primary bg-opacity-10 text-dark py-2 px-3">{sub}</span>
                  ))}
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className="row gy-4">
          <div className="col-lg-8">
            <div className="bg-white rounded shadow-sm p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h2 className="h4 mb-1">{selectedCategory.name}</h2>
                  <p className="text-muted mb-0">Select a subcategory below and explore community conversations.</p>
                </div>
                <span className="badge bg-primary py-2 px-3">{selectedCategory.badge}</span>
              </div>
              <div className="row g-3">
                {selectedCategory.subcategories.map((sub) => (
                  <div className="col-sm-6" key={sub}>
                    <div className="border rounded p-3 h-100">
                      <h5 className="mb-2">{sub}</h5>
                      <p className="text-muted mb-3">Community chat, progress reports, and shared tips for {sub.toLowerCase()}.</p>
                      <div className="d-flex gap-2 flex-wrap">
                        <span className="badge bg-secondary">Chat</span>
                        <span className="badge bg-success">Achievements</span>
                        <span className="badge bg-info text-dark">Progress</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="bg-light rounded p-4 h-100">
              <h3 className="h5 mb-4">Community Actions</h3>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                  Active support threads
                  <span className="badge bg-primary rounded-pill">24</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                  Recent achievements
                  <span className="badge bg-success rounded-pill">12</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                  Latest progress reports
                  <span className="badge bg-info text-dark rounded-pill">9</span>
                </li>
              </ul>
              <div className="mt-4">
                <h5>Quick start</h5>
                <p className="small text-muted">Choose a category, join a discussion, and add your own experience.</p>
                <button className="btn btn-primary w-100">Start a discussion</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-4">
          {currentActivities.map((activity) => (
            <div className="col-lg-4" key={activity.id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="badge bg-primary">{activity.type}</span>
                    <small className="text-muted">{activity.user}</small>
                  </div>
                  <h5 className="card-title">{activity.title}</h5>
                  <p className="card-text text-muted">{activity.message}</p>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <small className="text-muted">Community share</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
