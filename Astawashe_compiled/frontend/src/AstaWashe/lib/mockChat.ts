type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN';

type MockCase = {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  doctor: { id: string; name: string; specialty: string };
  patient: { id: string; fullName: string; phone?: string };
  createdAt: string;
  updatedAt: string;
};

type MockMessage = {
  id: string;
  caseId: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  senderName: string;
  content: string;
  createdAt: string;
};

type MockNotification = {
  id: string;
  targetRole: 'PATIENT' | 'DOCTOR';
  title: string;
  message: string;
  type: 'MESSAGE' | 'MEDICATION' | 'HABIT' | 'TIP';
  caseId?: string;
  readAt?: string | null;
  createdAt: string;
};

const CASES_KEY = 'mockCases';
const MESSAGES_KEY = 'mockMessages';
const NOTIFICATIONS_KEY = 'mockNotifications';

const seedData = () => {
  const now = new Date().toISOString();
  const cases: MockCase[] = [
    {
      id: 'case-1',
      title: 'Initial cardiology consult',
      description: 'Review ECG and medication adherence',
      status: 'IN_PROGRESS',
      doctor: { id: 'doc-1', name: 'Dr. Hana Bekele', specialty: 'Cardiology' },
      patient: { id: 'pat-1', fullName: 'Samuel Tesfaye', phone: '+251-911-111-111' },
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'case-2',
      title: 'Diabetes follow-up',
      description: 'Discuss meal plan adjustments and glucose logs',
      status: 'OPEN',
      doctor: { id: 'doc-1', name: 'Dr. Hana Bekele', specialty: 'Cardiology' },
      patient: { id: 'pat-2', fullName: 'Meseret Alemu', phone: '+251-922-222-222' },
      createdAt: now,
      updatedAt: now
    }
  ];

  const messages: MockMessage[] = [
    {
      id: 'msg-1',
      caseId: 'case-1',
      senderRole: 'PATIENT',
      senderName: 'Samuel Tesfaye',
      content: 'Hello doctor, I feel mild chest pain after jogging.',
      createdAt: now
    },
    {
      id: 'msg-2',
      caseId: 'case-1',
      senderRole: 'DOCTOR',
      senderName: 'Dr. Hana Bekele',
      content: 'Thanks for reporting. We will schedule a stress test.',
      createdAt: now
    }
  ];

  const notifications: MockNotification[] = [
    {
      id: 'noti-1',
      targetRole: 'PATIENT',
      title: 'Doctor update',
      message: 'Your cardiology follow-up is scheduled for next week.',
      type: 'MESSAGE',
      caseId: 'case-1',
      readAt: null,
      createdAt: now
    },
    {
      id: 'noti-2',
      targetRole: 'DOCTOR',
      title: 'New patient message',
      message: 'Samuel Tesfaye sent a message in Case #case-1.',
      type: 'MESSAGE',
      caseId: 'case-1',
      readAt: null,
      createdAt: now
    },
    {
      id: 'noti-3',
      targetRole: 'PATIENT',
      title: 'Medication reminder',
      message: 'Take Amlodipine 5mg with water this morning.',
      type: 'MEDICATION',
      readAt: null,
      createdAt: now
    },
    {
      id: 'noti-4',
      targetRole: 'PATIENT',
      title: 'Habit reminder',
      message: 'Time for your 30-minute evening walk.',
      type: 'HABIT',
      readAt: null,
      createdAt: now
    },
    {
      id: 'noti-5',
      targetRole: 'PATIENT',
      title: 'Health tip',
      message: 'Drink a glass of water now to stay hydrated.',
      type: 'TIP',
      readAt: null,
      createdAt: now
    }
  ];

  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const ensureSeeded = () => {
  if (!localStorage.getItem(CASES_KEY)) {
    seedData();
  }
};

const getCases = (): MockCase[] => {
  ensureSeeded();
  return JSON.parse(localStorage.getItem(CASES_KEY) || '[]');
};

const saveCases = (cases: MockCase[]) => {
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
};

const getMessages = (): MockMessage[] => {
  ensureSeeded();
  return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
};

const saveMessages = (messages: MockMessage[]) => {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

const getNotifications = (): MockNotification[] => {
  ensureSeeded();
  return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
};

const saveNotifications = (notifications: MockNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

const addNotificationForRole = (
  role: 'PATIENT' | 'DOCTOR',
  title: string,
  message: string,
  type: MockNotification['type'],
  caseId?: string
) => {
  const notifications = getNotifications();
  const newNotification: MockNotification = {
    id: `noti-${Date.now()}`,
    targetRole: role,
    title,
    message,
    type,
    caseId,
    readAt: null,
    createdAt: new Date().toISOString()
  };
  saveNotifications([newNotification, ...notifications]);
};

const getMockCasesForRole = (role?: Role) => {
  const cases = getCases();
  if (role === 'PATIENT') {
    return cases.filter((item) => item.patient.id === 'pat-1' || item.patient.id === 'pat-2');
  }
  if (role === 'DOCTOR') {
    return cases.filter((item) => item.doctor.id === 'doc-1');
  }
  return cases;
};

const getMockCaseById = (caseId?: string) => {
  if (!caseId) return null;
  return getCases().find((item) => item.id === caseId) || null;
};

const getMockMessages = (caseId?: string) => {
  if (!caseId) return [];
  return getMessages().filter((msg) => msg.caseId === caseId);
};

const sendMockMessage = (caseId: string, senderRole: 'PATIENT' | 'DOCTOR', senderName: string, content: string) => {
  const messages = getMessages();
  const newMessage: MockMessage = {
    id: `msg-${Date.now()}`,
    caseId,
    senderRole,
    senderName,
    content,
    createdAt: new Date().toISOString()
  };
  saveMessages([...messages, newMessage]);

  if (senderRole === 'PATIENT') {
    addNotificationForRole('DOCTOR', 'New patient message', `${senderName} sent a message in Case #${caseId}.`, 'MESSAGE', caseId);
  } else {
    addNotificationForRole('PATIENT', 'Doctor update', `${senderName} replied in Case #${caseId}.`, 'MESSAGE', caseId);
  }

  return newMessage;
};

const updateMockCaseStatus = (caseId: string, status: MockCase['status']) => {
  const cases = getCases();
  const updated = cases.map((item) =>
    item.id === caseId ? { ...item, status, updatedAt: new Date().toISOString() } : item
  );
  saveCases(updated);
  return updated.find((item) => item.id === caseId) || null;
};

const getMockNotificationsForRole = (role?: Role, limit = 6) => {
  if (!role) return [];
  const list = getNotifications().filter((item) => item.targetRole === role);
  if (role !== 'PATIENT') {
    return list.slice(0, limit);
  }

  const patientName = 'Samuel';
  const fixedPatientNotifications: MockNotification[] = [
    {
      id: 'fixed-drug-reminder',
      targetRole: 'PATIENT',
      title: 'Medication reminder',
      message: `Hey ${patientName}, your drug taking time is now. Please take it on time. Proper and timely drug taking is so crucial for your recovery.`,
      type: 'MEDICATION',
      readAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fixed-health-tip',
      targetRole: 'PATIENT',
      title: 'General health tip',
      message: 'For better cardiac health, aim for 30 minutes of light activity today and keep your salt intake low.',
      type: 'TIP',
      readAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'fixed-habit-streak',
      targetRole: 'PATIENT',
      title: 'Habit streak',
      message: `Hey ${patientName}, please keep your daily habit of staying hydrated and walking. You have a good streak. Please keep it.`,
      type: 'HABIT',
      readAt: null,
      createdAt: new Date().toISOString()
    }
  ];

  const combined = [...list, ...fixedPatientNotifications];
  return combined.slice(0, limit + fixedPatientNotifications.length);
};

const markMockNotificationRead = (id: string) => {
  const notifications = getNotifications();
  const updated = notifications.map((item) =>
    item.id === id ? { ...item, readAt: new Date().toISOString() } : item
  );
  saveNotifications(updated);
};

export {
  getMockCasesForRole,
  getMockCaseById,
  getMockMessages,
  sendMockMessage,
  updateMockCaseStatus,
  getMockNotificationsForRole,
  markMockNotificationRead
};
