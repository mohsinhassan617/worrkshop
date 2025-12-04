// WorkshopApp.jsx
import React, { useState, useEffect } from 'react';
import {  Users, Calendar, Clock, LogIn,Trash2, Search, LogOut, Download } from 'lucide-react';
import { databases, account } from './appwrite'; // keep your appwrite client config file
import { ID, Query } from 'appwrite';
import emailjs from 'emailjs-com';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/solid';
import {  } from 'lucide-react';


const DB_ID = process.env.REACT_APP_APPWRITE_DB_ID || 'regdb';
const COL_ID = process.env.REACT_APP_APPWRITE_COLLECTION_ID || '692a9f82002dabe4ac9c';
const WORKSHOP_CAPACITY = 25;

// EmailJS envs (configure in .env)
const EMAILJS_SERVICE = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_USER = process.env.REACT_APP_EMAILJS_USER_ID || '';





export default function WorkshopApp() {
  const [view, setView] = useState('registration');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {view === 'registration' ? <RegistrationView onAdminClick={() => setView('admin')} /> : <AdminView onBackClick={() => setView('registration')} />}
    </div>
  );
}

/* ---------------- Registration ---------------- */
function RegistrationView({ onAdminClick }) {
  const [seatsRemaining, setSeatsRemaining] = useState(WORKSHOP_CAPACITY);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
const [popupMessage, setPopupMessage] = useState("");


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    whatsapp: '',
    affiliation: '',
    department: '',
    designation: '',

    contactMethod: ''
  });

  useEffect(() => { fetchSeats(); }, []);

  const fetchSeats = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, COL_ID, [ Query.limit(1) ]);
      setSeatsRemaining(Math.max(0, WORKSHOP_CAPACITY - res.total));
    } catch (err) { console.error('fetchSeats', err); }
  };

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Valid email required';
    if (!formData.phone.match(/^\+?[\d\s-()]{10,}$/)) return 'Valid phone number required';
    if (!formData.dob.trim()) return 'Date of birth is required';
    if (!formData.whatsapp.trim()) return 'WhatsApp number is required';
    if (!formData.department.trim()) return 'Department is required';
    if (!formData.designation.trim()) return 'Designation is required';
    if (!formData.affiliation.trim()) return 'Affiliation is required';
    if (!['Faculty', 'Academic Administrator', 'Officer', 'Other'].includes(formData.designation)) return 'Invalid designation';
    if (!['Email', 'Phone', 'Both'].includes(formData.contactMethod)) return 'Please select a contact method';

    return null;
  };

  const sendEmailClient = async (registration) => {
    // Uses EmailJS (client-side). Ensure EMAILJS env vars are set.
    if (!EMAILJS_SERVICE || !EMAILJS_TEMPLATE || !EMAILJS_USER) {
      console.warn('EmailJS not configured, skipping email send.');
      return;
    }

    const templateParams = {
      to_name: registration.name,
      to_email: registration.email,
      phone: registration.phone,
      dob: registration.dob,
      whatsapp: registration.whatsapp,
      affiliation: registration.affiliation,
      department: registration.department,  
      designation: registration.designation,
      contactMethod: registration.contactMethod,
      workshopTitle: 'Python for Artificial Intelligence Driven Teaching & Research',
      dates: 'December 15–19, 2025',
      reg_id: registration.$id || ''
    };

    try {
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams, EMAILJS_USER);
      console.log('Email sent via EmailJS');
    } catch (err) {
      console.error('EmailJS send error', err);
    }
  };

 const handleSubmit = async () => {
    

  const error = validateForm();
  if (error) return setAlert({ type: "error", message: error });

  if (seatsRemaining <= 0)
    return setAlert({ type: "error", message: "No seats remaining." });

  // 🔍 DUPLICATE CHECK (email)
try {
  const existing = await databases.listDocuments(DB_ID, COL_ID, [
    Query.equal("email", formData.email)
  ]);

  if (existing.total > 0) {
    setPopupMessage(
      "This email is already registered.\nIf you believe this is an error, please contact the support team."
    );
    setShowPopup(true);
    return; // stop submission
  }
} catch (err) {
  console.error("Duplicate check error:", err);
  setPopupMessage(
    "Unable to verify existing registrations at the moment.\nPlease try again."
  );
  setShowPopup(true);
  return;
}

  try {
    // Create new document
    const created = await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      whatsapp: formData.whatsapp,
      affiliation: formData.affiliation,
      department: formData.department,
      designation: formData.designation,
      contactMethod: formData.contactMethod,
      createdAt: new Date().toISOString()
    });

    setPopupMessage(
      "Your registration has been received.\nPlease note that participation is based on selection. The list of selected candidates will be communicated by December 12, 2025."
    );
    setShowPopup(true);

    await sendEmailClient(created);

    setFormData({
      name: "",
      email: "",
      phone: "",
      dob: "",
      whatsapp: "",
      affiliation: "",
      department: "",
      designation: "",
      contactMethod: ""
    });

    fetchSeats();
  } catch (err) {
    console.error(err);
    setAlert({
      type: "error",
      message: "Registration failed: " + (err.message || String(err))
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header + Logo */}
        <div className="card text-center space-y-4">
          <img src="/logo.png" alt="MMTTC Logo" className="mx-auto w-28 h-28 object-contain" />
          <h2 className="text-xl font-semibold text-gray-700">Malaviya Mission Teacher Training Centre (MMTTC)</h2>
          <h3 className="text-md text-gray-600">University of Jammu</h3>
          <p className="text-sm text-gray-600 -mt-2">In collaboration with SIIEDC, University of Jammu<br /><span className="text-gray-500">(Under RUSA-II Faculty Improvement Support)</span></p>

          <h1 className="heading leading-snug">
            Five-Day <br />Capacity Building Program & Workshop on<br />
            <span className="text-indigo-700">Python for Artificial Intelligence Driven Teaching & Research</span>
          </h1>

          <p className="text-gray-700 font-medium">December 15–19, 2025</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
            <div className="flex items-center justify-center gap-2 text-gray-700"><Calendar className="w-5 h-5 text-indigo-600" /><span>5-Day Intensive Program</span></div>
            <div className="flex items-center justify-center gap-2 text-gray-700"><Clock className="w-5 h-5 text-indigo-600" /><span>Hands-on Coding + AI Tools</span></div>
            <div className="flex items-center justify-center gap-2 text-gray-700"><Users className="w-5 h-5 text-indigo-600" /><span className={seatsRemaining <= 5 ? 'text-red-600 font-semibold' : 'font-semibold'}>{seatsRemaining} Seats Remaining</span></div>
          </div>
        </div>

        {/* Intro */}
        <div className="card space-y-4 text-gray-700 text-sm leading-relaxed text-justify">
            
          <p>The Malaviya Mission Teacher Training Centre (MMTTC), University of Jammu, announces a specialized Five-Day Capacity Building Program on <strong>“Python for Artificial Intelligence Driven Teaching & Research”</strong> scheduled for December 15–19, 2025.</p>
          <p>This program focuses on practical solutions to support academic and administrative workloads — participants leave with working code and workflows.</p>

          <h3 className="font-semibold text-gray-900">Workshop Highlights</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Python for automation of academic/admin tasks</li>
            <li>Hands-on with AI Chatbots (ChatGPT/Gemini)</li>
            <li>Prompt engineering exercises</li>
            <li>AI-assisted research and reporting</li>
            <li>Data ethics, privacy, and integrity</li>
          </ul>

          <p><strong>Eligibility:</strong> Faculty members from all disciplines + Academic Administrators.<br /><strong>Selection:</strong> First-come, first-served (25 seats).</p>
         <p><strong>Note:</strong> <br />
            i. For effective hands-on training, participants are encouraged to bring their own laptops.<br />ii. Participants are required to make their own arrangements for stay.</p>
        </div>

       
        {/* Alerts */}
        {showPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
      <h2 className="text-xl font-semibold mb-4 text-indigo-700">Registration Received</h2>
      <p className="text-gray-700 whitespace-pre-line">{popupMessage}</p>

      <button
        onClick={() => setShowPopup(false)}
        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        OK
      </button>
    </div>
  </div>
)}

       
{alert && (
  <div className="p-3 mb-4 rounded text-white bg-red-600 text-center">
    {alert.message}
  </div>
)}

        {/* Registration Form */}
        <div className="card">
          <h2 className="heading text-center mb-2">Registration Form</h2>
<div className="marquee-box mb-6">
  <div className="marquee-inner">
    <span className="marquee-item">
      IMPORTANT: Last Date for registration is December 10, 2025. Selected participants will be notified by December 12 (Mobile/WhatsApp/Email).
    </span>

    {/* duplicate for seamless infinite loop */}
    <span className="marquee-item">
      IMPORTANT: Last Date for registration is December 10, 2025. Selected participants will be notified by December 12 (Mobile/WhatsApp/Email).
    </span>
  </div>
</div>


          <div className="space-y-6">
            <input className="input" name="name" placeholder="Full Name *" value={formData.name} onChange={handleChange} />
            <div className="grid md:grid-cols-2 gap-6">
              <input className="input" name="email" placeholder="Email *" value={formData.email} onChange={handleChange} />
              <input className="input" name="phone" placeholder="Phone *" value={formData.phone} onChange={handleChange} />
              <input className="input" name="dob" placeholder="Date of Birth (DD/MM/YYYY) *" value={formData.dob} onChange={handleChange} />
            <input className="input" name="whatsapp" placeholder="WhatsApp Number *" value={formData.whatsapp} onChange={handleChange} />

            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <select className="input" name="designation" value={formData.designation} onChange={handleChange}>
                <option>Select Designation *</option>
                <option>Faculty</option>
                <option>Academic Administrator</option>
                <option>Officer</option>
                <option>Other</option>
              </select>
            </div>
            <input className="input" name="affiliation" placeholder="Affiliation *" value={formData.affiliation} onChange={handleChange} />
            <input className="input" name="department" placeholder="Department *" value={formData.department} onChange={handleChange} />    

           <select
  className="input"
  name="contactMethod"
  value={formData.contactMethod}
  onChange={handleChange}
>
  <option value="" disabled className="placeholder-option">
    Contact Options *
  </option>
  <option value="Email">Email</option>
  <option value="Phone">Phone</option>
  <option value="Both">Both</option>
</select>

            <button className="btn-primary w-full" onClick={handleSubmit} disabled={loading || seatsRemaining <= 0}>{loading ? 'Submitting...' : 'Register Now'}</button>
          </div>
          


          <p className="text-center text-sm text-gray-600 mt-6"><button onClick={onAdminClick} className="text-indigo-600 hover:underline">Admin Login</button></p>
        </div>

        
        {/* Coordinator / Contact */}
       

  <div className="card text-sm text-gray-700">
  <h3 className="font-semibold text-gray-900 mb-2">Patron</h3>

  <div className="flex items-center gap-4">
    <div className="flex-1 leading-snug">
      <p>
        <strong>Prof Umesh Rai</strong><br />
        Hon'ble Vice Chancellor<br />
        University of Jammu
      </p>
    </div>

    <div className="w-28 h-28 overflow-hidden rounded-lg shadow">
      <img src="/vc.jpg"  alt="VC photo"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
</div>

<div className="card text-sm text-gray-700">
  <h3 className="font-semibold text-gray-900 mb-2">Advisor</h3>

  <div className="flex items-center gap-4">
    <div className="flex-1 leading-snug">
      <p>
        <strong>Prof S.K. Pandita</strong><br />
        Director<br />
        Malaviya Mission Teacher Training Centre (MMTTC)<br />
        University of Jammu
      </p>
    </div>

    <div className="w-28 h-28 overflow-hidden rounded-lg shadow">
      <img
        src="/sk.png"
        alt="Advisor"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
</div>



          <div className="card text-sm text-gray-700">
  <h3 className="font-semibold text-gray-900 mb-2">Convener</h3>

  <div className="flex items-center gap-4">
    <div className="flex-1 leading-snug">
      <p>
        <strong>Prof Alka Sharma</strong><br />
        Director<br />
        Skill Incubation Innovation Entrepreneurship Development Centre (SIIEDC)<br />
        University of Jammu
      </p>
    </div>

    <div className="w-28 h-28 overflow-hidden rounded-lg shadow">
      <img
        src="/alka.png"
        alt="Convener"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
</div>

<div className="card text-sm text-gray-700">
  <h3 className="font-semibold text-gray-900 mb-2">Coordinator</h3>

  <div className="flex items-center gap-4">
    <div className="flex-1 leading-snug">
      <p>
        <strong>Dr. Jatinder Manhas</strong><br />
        Associate Professor, CS & IT<br />
        Associate Director, SIIEDC
      </p>

      <p className="mt-2">
        Email: <span className="text-indigo-700">jatindermanhas@jammuuniversity.ac.in</span><br />
        Phone: 94191 73793 | 80827 70939
      </p>
    </div>

    <div className="w-28 h-28 overflow-hidden rounded-lg shadow">
      <img
        src="/jat.png"
        alt="Coordinator"
        className="w-full h-full object-cover"
      />
    </div>
  </div>
</div>
<div className="card text-sm text-gray-700 mt-4">
  <h3 className="font-semibold text-gray-900 mb-2">Support Contacts</h3>

  {/* Emails */}
  <div className="flex items-center gap-2 mt-1">
    <EnvelopeIcon className="w-4 h-4 text-indigo-700" />
    <p>associatedirectorsiiedcju@gmail.com</p>
  </div>

  <div className="flex items-center gap-2 mt-1">
    <EnvelopeIcon className="w-4 h-4 text-indigo-700" />
    <p>mohsinhassan@outlook.in</p>
  </div>

  {/* Phones */}
  <div className="flex items-center gap-2 mt-3">
    <PhoneIcon className="w-4 h-4 text-green-700" />
    <p>94191 73793</p>
  </div>

  <div className="flex items-center gap-2 mt-1">
    <PhoneIcon className="w-4 h-4 text-green-700" />
    <p>8492013757</p>
  </div>
</div>
        </div>
        </div>
       


    
        
        
  );
}


/* ---------------- Admin View ---------------- */
function AdminView({ onBackClick }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        await account.get();
        setIsLoggedIn(true);
        fetchDashboardData();
      } catch {
        setIsLoggedIn(false);
      }
    };
    check();
  }, []);

  const handleLogin = async () => {
    try {
      await account.createEmailPasswordSession(
        loginData.email,
        loginData.password
      );
      setIsLoggedIn(true);
      fetchDashboardData();
    } catch (err) {
      setAlert({ type: 'error', message: 'Login failed: ' + err.message });
    }
  };

  const handleLogout = async () => {
    await account.deleteSession('current');
    setIsLoggedIn(false);
    onBackClick();
  };

  const fetchDashboardData = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, COL_ID, [
        Query.limit(500),
        Query.orderDesc('$createdAt'),
      ]);
      setRegistrations(res.documents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await databases.deleteDocument(DB_ID, COL_ID, docId);
      fetchDashboardData();
    } catch {
      alert('Failed to delete');
    }
  };

  /* ------------ CSV EXPORT (Updated for full schema) ------------ */
  const handleExportCSV = () => {
    if (registrations.length === 0)
      return setAlert({ type: 'error', message: 'No data to export.' });

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'DOB',
      'WhatsApp',
      'Affiliation',
      'Department',
      'Designation',
      'Contact Method',
      'Registration Date',
    ];

    const rows = registrations.map((r) =>
      [
        r.$id,
        r.name,
        r.email,
        r.phone,
        r.dob,
        r.whatsapp,
        r.affiliation,
        r.department,
        r.designation,
        r.contactMethod,
        new Date(r.$createdAt).toLocaleString(),
      ]
        .map((v) => `"${v ?? ''}"`)
        .join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'workshop-registrations.csv';
    a.click();
  };

  /* ------------ Search Filter ------------ */
  const filtered = registrations.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ------------ Login Screen ------------ */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold">Admin Login</h2>
          </div>

          {alert && (
            <div className="alert-error p-4 mb-4 rounded">
              {alert.message}
            </div>
          )}

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
            />
            <button onClick={handleLogin} className="btn-primary w-full">
              Login
            </button>

            <button
              onClick={onBackClick}
              className="text-indigo-600 mt-2 hover:underline"
            >
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------ Dashboard Screen ------------ */
  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>

            <button
              className="flex items-center gap-2 text-red-600 hover:underline"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Seats Remaining</p>
              <p className="text-3xl font-bold text-indigo-600">
                {Math.max(0, WORKSHOP_CAPACITY - registrations.length)}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">
                Total Registrations
              </p>
              <p className="text-3xl font-bold text-green-600">
                {registrations.length}
              </p>
            </div>
          </div>

          <button className="btn-export mb-6" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <div className="relative mb-4">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              className="input search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* ------------ Table (FULL SCHEMA) ------------ */}
          <div className="overflow-x-auto">
            <table className="w-full table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>DOB</th>
                  <th>WhatsApp</th>
                  <th>Affiliation</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filtered.map((reg) => (
                  <tr key={reg.$id} className="hover:bg-gray-50">
                    <td>{reg.name}</td>
                    <td>{reg.email}</td>
                    <td>{reg.phone}</td>
                    <td>{reg.dob}</td>
                    <td>{reg.whatsapp}</td>
                    <td>{reg.affiliation}</td>
                    <td>{reg.department}</td>
                    <td>{reg.designation}</td>
                    <td>{reg.contactMethod}</td>
                    <td>{new Date(reg.$createdAt).toLocaleString()}</td>

                    <td>
  <button
    className="btn-danger flex items-center justify-center"
    onClick={() => handleDelete(reg.$id)}
  >
    <Trash2 className="w-4 h-4" />
  </button>
</td>

                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No registrations found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

