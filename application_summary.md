# Ski Instructor Application Summary

This application is a web-based tool designed to help ski instructors efficiently manage their lessons, clients, and earnings. Built with React and TypeScript, it utilizes Supabase for robust backend services, including user authentication and data storage.

## Key Features:

### 1. User Authentication
- **Secure Access:** Users can securely log in and out, with session management handled by Supabase Authentication.

### 2. Instructor Dashboard
- **Overview of Performance:** A central dashboard provides instructors with real-time statistics:
    - **Total Hours:** Accumulated hours of lessons given.
    - **Estimated Earnings:** Calculated based on a user-defined hourly rate, providing a clear financial overview.
    - **Total Clients:** The total number of unique clients the instructor has taught.
    - **Average Goal Score:** An average satisfaction score, likely derived from client feedback or lesson outcomes.

### 3. Lesson Management
- **Add New Lessons:** Instructors can easily add new lessons, inputting details such as lesson duration, whether it's a group or individual lesson, and client names.
- **Data Storage:** All lesson data is securely stored and managed within Supabase.

### 4. Client Management
- **Client List:** A dedicated section allows instructors to view and potentially manage their list of clients.

### 5. Profile Settings
- **Personal Customization:** Users have access to profile settings where they can update their personal information.

### 6. Hourly Rate Configuration
- **Flexible Earnings Calculation:** Instructors can set and adjust their hourly rate. This rate is then used across the application to calculate total earnings, and it is persistently stored locally in the browser.

## Technical Stack:
- **Frontend:** React with TypeScript
- **Bundler/Development Server:** Vite
- **Backend/Database:** Supabase (for authentication and data persistence)
- **Styling:** Standard CSS