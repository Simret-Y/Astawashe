import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import './App.css'

type Patient = {
  id: string
  name: string
  illness: string
  time: string
  instructions: string
  password: string
  takenMedicine: boolean
}

const initialPatients: Patient[] = [
  {
    id: 'HP-101',
    name: 'Amina Hassan',
    illness: 'High blood pressure',
    time: '08:00 AM',
    instructions: 'Take 1 tablet after breakfast and 1 after dinner. Drink plenty of water.',
    password: 'MedCare-101',
    takenMedicine: true,
  },
  {
    id: 'HP-102',
    name: 'Samir Nabil',
    illness: 'Asthma',
    time: '09:30 AM',
    instructions: 'Use the inhaler every 8 hours and keep it close during attacks.',
    password: 'MedCare-102',
    takenMedicine: false,
  },
]

const generatePatientId = () => `HP-${Math.floor(100 + Math.random() * 900)}`
const generatePassword = () => `MedCare-${Math.floor(1000 + Math.random() * 9000)}`

function App() {
  const [formData, setFormData] = useState({
    name: '',
    illness: '',
    time: '',
    instructions: '',
  })
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0].id)
  const [lastCreated, setLastCreated] = useState<Patient | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAlarmPreview, setShowAlarmPreview] = useState(false)

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return patients
    }

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      patient.illness.toLowerCase().includes(query),
    )
  }, [patients, searchTerm])

  const visiblePatient =
    filteredPatients.find((patient) => patient.id === selectedPatientId) ??
    filteredPatients[0] ??
    null

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleCreatePatient = (event: FormEvent) => {
    event.preventDefault()

    const patientName = formData.name.trim()
    const illness = formData.illness.trim()
    const time = formData.time.trim()
    const instructions = formData.instructions.trim()

    if (!patientName || !illness || !time || !instructions) {
      return
    }

    const newPatient: Patient = {
      id: generatePatientId(),
      name: patientName,
      illness,
      time,
      instructions,
      password: generatePassword(),
      takenMedicine: false,
    }

    setPatients((current) => [newPatient, ...current])
    setSelectedPatientId(newPatient.id)
    setLastCreated(newPatient)
    setFormData({ name: '', illness: '', time: '', instructions: '' })
    setShowAlarmPreview(false)
  }

  const handleToggleMedicine = (patientId: string) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? { ...patient, takenMedicine: !patient.takenMedicine }
          : patient,
      ),
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">+</div>
          <div>
            <p className="eyebrow">Hospital system</p>
            <h1>Admin portal</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className="nav-button active">
            Patient management
          </button>
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow muted">Overview</p>
            <h2>Medication dashboard</h2>
          </div>
          <div className="status-pill">Live monitoring</div>
        </header>

        <section className="panel form-panel">
          <div className="section-heading">
            <h3>Create patient account</h3>
          </div>

          <form className="patient-form" onSubmit={handleCreatePatient}>
            <label>
              Patient name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter patient name"
              />
            </label>

            <label>
              Illness
              <input
                type="text"
                name="illness"
                value={formData.illness}
                onChange={handleInputChange}
                placeholder="Type illness"
              />
            </label>

            <label>
              Medicine time
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </label>

            <label>
              Medicine instructions
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Write the exact medicine instructions the hospital provides"
                rows={4}
              />
            </label>

            <button type="submit" className="primary-button">
              Create patient account
            </button>
          </form>
        </section>

        {lastCreated && (
          <section className="panel credentials-panel">
            <h3>New patient created</h3>
            <div className="credential-grid">
              <div>
                <span>User ID</span>
                <strong>{lastCreated.id}</strong>
              </div>
              <div>
                <span>Password</span>
                <strong>{lastCreated.password}</strong>
              </div>
            </div>
          </section>
        )}

        <section className="panel search-panel">
          <div className="section-heading">
            <h3>Search patient</h3>
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, ID, or illness"
            className="search-input"
          />
        </section>

        <section className="content-grid">
          <div className="panel patient-list-panel">
            <div className="section-heading compact">
              <h3>Patients</h3>
            </div>

            {filteredPatients.length === 0 ? (
              <p className="empty-state">No patient matches your search.</p>
            ) : (
              <div className="patient-list">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className={`patient-item ${
                      visiblePatient?.id === patient.id ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div>
                      <strong>{patient.name}</strong>
                      <span>{patient.illness}</span>
                    </div>
                    <span className={`dot ${patient.takenMedicine ? 'ok' : 'warning'}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="panel patient-detail-panel">
            {visiblePatient ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow muted">Patient profile</p>
                    <h3>{visiblePatient.name}</h3>
                  </div>
                  <span className={`status-tag ${visiblePatient.takenMedicine ? 'ok' : 'warning'}`}>
                    {visiblePatient.takenMedicine ? 'Medicine taken' : 'Pending'}
                  </span>
                </div>

                <div className="info-grid">
                  <div>
                    <span>ID</span>
                    <strong>{visiblePatient.id}</strong>
                  </div>
                  <div>
                    <span>Password</span>
                    <strong>{visiblePatient.password}</strong>
                  </div>
                  <div>
                    <span>Illness</span>
                    <strong>{visiblePatient.illness}</strong>
                  </div>
                  <div>
                    <span>Medicine time</span>
                    <strong>{visiblePatient.time}</strong>
                  </div>
                </div>

                <div className="instruction-box">
                  <h4>Instructions</h4>
                  <p>{visiblePatient.instructions}</p>
                </div>

                <div className="action-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleToggleMedicine(visiblePatient.id)}
                  >
                    {visiblePatient.takenMedicine ? 'Mark as not taken' : 'Mark as taken'}
                  </button>

                  {!visiblePatient.takenMedicine && (
                    <button
                      type="button"
                      className="alarm-button"
                      onClick={() => setShowAlarmPreview((current) => !current)}
                    >
                      {showAlarmPreview ? 'Hide alarm preview' : 'Show alarm preview'}
                    </button>
                  )}
                </div>

                {!visiblePatient.takenMedicine && showAlarmPreview && (
                  <div className="alarm-box" role="alert">
                    <div className="alarm-header">
                      <span className="alarm-icon">!</span>
                      <strong>Medication alert</strong>
                    </div>
                    <p>
                      {visiblePatient.name} has not taken their medicine yet. Please follow
                      up immediately.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="empty-state">Select a patient to view their record.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
