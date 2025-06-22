# Changelog

All notable changes to the Satisfactory Factory Planner project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-06-22

### Added
- **Factory Satisfaction Status in Sidebar**: Visual indicators showing which factories have missing dependencies
- **Real-time Status Tracking**: Factory status updates automatically as production lines and imports change
- **Sidebar Status Overview**: Summary showing how many factories are satisfied vs need attention
- **Status Filter**: Filter sidebar to show only factories with dependency issues
- **Enhanced Factory Cards**: Visual status indicators with detailed tooltips showing missing ingredient counts
- **Color-coded Borders**: Red borders for unsatisfied factories, green indicators for satisfied ones
- **Status Cleanup**: Automatic removal of status tracking when factories are deleted

### Changed
- **Sidebar Interface**: Enhanced with factory status visualization and filtering capabilities
- **Factory Navigation**: Cards now display satisfaction status with clear visual indicators
- **User Experience**: At-a-glance overview of all factory health status

### Fixed
- **Critical Performance Issue**: Fixed "Maximum update depth exceeded" error by eliminating all circular dependencies
- **Dependency Tracker Optimization**: Eliminated infinite loops in dependency refresh logic with useRef pattern
- **Import State Management**: Removed circular dependency between imports state and auto-refresh logic
- **Factory Section Optimization**: Memoized available inputs calculation to prevent unnecessary re-renders
- **Status Persistence**: Factory status properly tracked and cleaned up across all operations
- **Visual Consistency**: Consistent status indicators across sidebar and main factory views
- **Render Optimization**: Improved component performance with proper memoization and dependency management

## [1.0.0] - 2025-06-22

### Added
- **Factory Exports Display System**: Complete visualization of which factories are importing from each factory
- **Enhanced Export Tracking**: Real-time monitoring of export relationships with automatic updates
- **Grouped Export Display**: Organized view by destination factory with detailed item breakdown
- **Improved Refresh System**: Immediate updates for all dependency calculations when production lines change
- **Advanced Supply Chain Visibility**: Complete overview of import/export relationships across all factories

### Changed
- **Dependency Calculations**: Now update immediately when production line targets are modified
- **State Management**: Enhanced refresh triggers for coordinated updates across all components
- **User Experience**: Better visual organization of factory relationships and supply chains

### Fixed
- **Real-time Updates**: Dependency tracker now immediately reflects production line changes
- **Calculation Accuracy**: Production requirements update correctly when target quantities change

## [0.9.0] - 2025-06-21

### Added
- **Complete Authentication System**: Google OAuth integration with NextAuth
- **User Data Isolation**: All factories and production lines are private to each user
- **Advanced Dependency Tracking**: Intelligent analysis of missing ingredients with import suggestions
- **Import/Export Management**: Create and manage supply chains between factories
- **Duplicate Import Prevention**: Smart validation to prevent conflicting imports
- **Dynamic Capacity Tracking**: Real-time updates when production capacity changes
- **Enhanced UI Components**: Modern interface with dismissible notifications
- **Recipes Database Page**: Searchable, filterable recipe browser with images
- **Migration Tools**: Administrative tools for legacy data migration
- **Comprehensive API Protection**: All endpoints secured with authentication

### Changed
- **Database Models**: Added userId fields for complete user data isolation
- **API Endpoints**: All routes now require authentication and filter by user
- **UI Navigation**: Updated TopNav with user information and sign-out functionality
- **Production Line Search**: Switched to server-side, debounced search for better performance

### Security
- **Session Management**: Secure, persistent user sessions with automatic refresh
- **API Security**: Complete protection of all data endpoints
- **Input Validation**: Enhanced validation across all user inputs

## [0.4.0] - 2025-06-21

### Removed
- Ko-fi and Discord buttons from navigation
- ALPHA v0.4 label from top bar

### Improved
- Database connection setup with .env.local configuration
- Error handling for failed factory data loads
- UI/UX with minor style and accessibility improvements

### Fixed
- Database connection reliability issues
- Error handling edge cases

## [0.3.0] - 2025-06-10

### Added
- Support for Cosmos DB connection
- Initial implementation of production line cards
- Sidebar navigation improvements

### Changed
- Database connectivity options expanded
- Production line interface enhanced

## [0.2.0] - 2025-06-05

### Added
- Basic factory management functionality
- Task and note management systems
- Initial production line planning

### Changed
- Database schema improvements
- API endpoint structure optimization

## [0.1.0] - 2025-06-01

### Added
- Initial project setup with Next.js 14+
- React 19+ and TypeScript configuration
- MongoDB integration with Mongoose
- Basic UI components with shadcn/ui
- TailwindCSS styling system
- Lucide React icons

### Technical
- Project foundation and development environment
- Core dependencies and build system
- Database connection and basic models

---

## Version Numbering

- **Major version** (X.0.0): Breaking changes or major feature releases
- **Minor version** (0.X.0): New features and significant enhancements
- **Patch version** (0.0.X): Bug fixes and minor improvements

## Links

- [Project Documentation](./docs/README.md)
- [Latest Status & Roadmap](./docs/11-project-status-and-roadmap.md)
- [Advanced Features Guide](./docs/15-advanced-factory-management.md)
