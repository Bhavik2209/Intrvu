import React from 'react';
import { HelpCircle } from 'lucide-react';
import { SectionType } from '../App';
import UserDropdown from './UserDropdown';
import FeedbackMenu from './FeedbackMenu';

interface SidebarProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  analysisStarted: boolean;
  showUserDropdown: boolean;
  setShowUserDropdown: (show: boolean) => void;
  showFeedbackMenu: boolean;
  setShowFeedbackMenu: (show: boolean) => void;
  onCloseApp?: () => void;
}

const sidebarItems = [
  { id: 'start' as SectionType, label: 'Start' },
  { id: 'results' as SectionType, label: 'Results' },
  // { id: 'overview' as SectionType, label: 'Overview' },
  { id: 'keywords' as SectionType, label: 'Keywords' },
  { id: 'experience' as SectionType, label: 'Experience' },
  { id: 'education' as SectionType, label: 'Education' },
  { id: 'skills' as SectionType, label: 'Skills' },
  { id: 'structure' as SectionType, label: 'Structure' },
  { id: 'action-verbs' as SectionType, label: 'Action Verbs' },
  { id: 'measurable-results' as SectionType, label: 'Measurable Results' },
  { id: 'bullet-effectiveness' as SectionType, label: 'Bullet Effectiveness' },
];

const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  analysisStarted,
  showUserDropdown,
  setShowUserDropdown,
  showFeedbackMenu,
  setShowFeedbackMenu
}) => {
  return (
    <aside className="w-32 bg-gray-100 flex-shrink-0 relative">
      <div className="pt-4 pb-4 flex flex-col items-center h-full">
        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-3">
          {/* <button 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all duration-200"
            aria-label="Open user menu"
          >
            <User className="w-5 h-5 text-gray-600" />
          </button> */}
        </div>

        <nav className="space-y-2 w-full flex flex-col items-center">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full text-center py-2 px-3 rounded font-medium text-sm transition-all duration-200 mx-2 whitespace-normal break-words leading-tight
                  ${isActive
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : !analysisStarted && item.id !== 'start'
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }
                `}
                disabled={!analysisStarted && item.id !== 'start'}
                title={item.label}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="mt-auto mb-3 flex flex-col items-center gap-3">
          <button
            onClick={() => setShowFeedbackMenu(!showFeedbackMenu)}
            className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all duration-200"
            aria-label="Help and feedback"
          >
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          <a
            href="https://bhavik2209.github.io/Intrvu/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-700 hover:bg-gray-50 transition-all duration-200 whitespace-nowrap"
            aria-label="Terms and Conditions"
            title="Terms & Conditions"
          >
            T&C
          </a>
        </div>
      </div>

      {showUserDropdown && (
        <UserDropdown onClose={() => setShowUserDropdown(false)} />
      )}

      {showFeedbackMenu && (
        <FeedbackMenu onClose={() => setShowFeedbackMenu(false)} />
      )}
    </aside>
  );
};

export default Sidebar;