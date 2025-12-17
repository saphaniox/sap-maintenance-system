import React, { useState } from 'react';
import '../styles/components/HelpModal.css';

export function HelpModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('getting-started');
  
  if (!isOpen) return null;
  
  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>📚 Help & Documentation</h2>
          <button onClick={onClose} className="help-modal-close">✕</button>
        </div>
        
        <div className="help-modal-body">
          {/* Tab navigation */}
          <div className="help-tabs">
            <button 
              className={`help-tab ${activeTab === 'getting-started' ? 'active' : ''}`}
              onClick={() => setActiveTab('getting-started')}
            >
              🚀 Getting Started
            </button>
            <button 
              className={`help-tab ${activeTab === 'keyboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('keyboard')}
            >
              ⌨️ Keyboard Shortcuts
            </button>
            <button 
              className={`help-tab ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              ❓ FAQ
            </button>
            <button 
              className={`help-tab ${activeTab === 'support' ? 'active' : ''}`}
              onClick={() => setActiveTab('support')}
            >
              💬 Support
            </button>
          </div>
          
          {/* Tab content */}
          <div className="help-content">
            {activeTab === 'getting-started' && <GettingStarted />}
            {activeTab === 'keyboard' && <KeyboardShortcuts />}
            {activeTab === 'faq' && <FAQ />}
            {activeTab === 'support' && <Support />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Getting Started content
function GettingStarted() {
  return (
    <div className="help-section">
      <h3>Welcome to Maintenance Tracker! 👋</h3>
      <p>This guide will help you get started with managing your maintenance operations.</p>
      
      <div className="help-step">
        <h4>1️⃣ Set Up Your Sites</h4>
        <p>Start by adding your facility sites where machines are located. Go to <strong>Sites</strong> and click "Add Site".</p>
      </div>
      
      <div className="help-step">
        <h4>2️⃣ Add Machines</h4>
        <p>Register all your machines under their respective sites. Navigate to <strong>Machines</strong> and add details like model, serial number, and installation date.</p>
      </div>
      
      <div className="help-step">
        <h4>3️⃣ Schedule Maintenance</h4>
        <p>Create preventive maintenance schedules to keep machines running smoothly. Go to <strong>Maintenance</strong> to schedule tasks.</p>
      </div>
      
      <div className="help-step">
        <h4>4️⃣ Track Inventory</h4>
        <p>Manage spare parts and supplies in the <strong>Inventory</strong> section. Set minimum stock levels to get automatic alerts.</p>
      </div>
      
      <div className="help-step">
        <h4>5️⃣ Monitor Dashboard</h4>
        <p>View real-time stats, upcoming maintenance, and critical alerts on your <strong>Dashboard</strong>.</p>
      </div>
    </div>
  );
}

// Keyboard Shortcuts content
function KeyboardShortcuts() {
  const shortcuts = [
    { keys: 'Ctrl + K', description: 'Open global search' },
    { keys: '?', description: 'Show this help modal' },
    { keys: 'Ctrl + N', description: 'Create new item (context-aware)' },
    { keys: 'Esc', description: 'Close modal or dialog' },
    { keys: 'Ctrl + S', description: 'Save current form' },
    { keys: 'Alt + D', description: 'Go to Dashboard' },
    { keys: 'Alt + M', description: 'Go to Machines' },
    { keys: 'Alt + T', description: 'Go to Maintenance' },
    { keys: 'Alt + I', description: 'Go to Inventory' },
    { keys: 'Ctrl + /', description: 'Toggle dark mode' },
  ];
  
  return (
    <div className="help-section">
      <h3>Keyboard Shortcuts ⚡</h3>
      <p>Use these shortcuts to navigate faster and boost your productivity.</p>
      
      <div className="shortcuts-list">
        {shortcuts.map(shortcut => (
          <div key={shortcut.keys} className="shortcut-item">
            <kbd className="shortcut-keys">{shortcut.keys}</kbd>
            <span className="shortcut-description">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ content
function FAQ() {
  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to your Profile page and click "Change Password". You\'ll need to enter your current password and choose a new one.'
    },
    {
      question: 'Can I export data to Excel?',
      answer: 'Yes! Most tables have an export button that lets you download data in Excel format (.xlsx).'
    },
    {
      question: 'How do maintenance alerts work?',
      answer: 'You\'ll receive notifications when maintenance is due, inventory is low, or machines need attention. Check the bell icon in the header.'
    },
    {
      question: 'What permissions do I need to add machines?',
      answer: 'You need either "Manager" or "Admin" role to add or edit machines. Operators can only view machine details.'
    },
    {
      question: 'How often is the dashboard updated?',
      answer: 'Dashboard statistics update in real-time as changes occur. Charts and graphs refresh every 30 seconds automatically.'
    },
  ];
  
  return (
    <div className="help-section">
      <h3>Frequently Asked Questions 💡</h3>
      
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h4 className="faq-question">{faq.question}</h4>
            <p className="faq-answer">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Support content
function Support() {
  return (
    <div className="help-section">
      <h3>Need More Help? 🤝</h3>
      <p>We're here to support you! Choose the best way to get assistance.</p>
      
      <div className="support-options">
        <div className="support-card">
          <div className="support-icon">📧</div>
          <h4>Email Support</h4>
          <p>Send us your questions or issues</p>
          <a href="mailto:support@maintenancetracker.com" className="support-link">
            support@maintenancetracker.com
          </a>
        </div>
        
        <div className="support-card">
          <div className="support-icon">📞</div>
          <h4>Phone Support</h4>
          <p>Talk to our support team</p>
          <a href="tel:+1234567890" className="support-link">
            +1 (234) 567-890
          </a>
        </div>
        
        <div className="support-card">
          <div className="support-icon">📖</div>
          <h4>Documentation</h4>
          <p>Detailed guides and tutorials</p>
          <a href="https://docs.maintenancetracker.com" target="_blank" rel="noopener noreferrer" className="support-link">
            View Documentation
          </a>
        </div>
        
        <div className="support-card">
          <div className="support-icon">🐛</div>
          <h4>Report Bug</h4>
          <p>Found an issue? Let us know</p>
          <a href="https://github.com/yourorg/maintenance-tracker/issues" target="_blank" rel="noopener noreferrer" className="support-link">
            Submit Issue
          </a>
        </div>
      </div>
      
      <div className="version-info">
        <p>Version 1.0.0 | Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default HelpModal;
