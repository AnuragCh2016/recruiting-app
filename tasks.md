# Tasks for TalentMason Recruiting App

Based on the requirements in `todo.txt`, here is a structured list of tasks to implement the dashboard metrics, role-based views, and top bar organization.

## Services

- [x] **Call Log Service**: To track and display call interactions for recruiters.
- [x] **User Service**: To manage user creation, role changes, and deactivation.

## Dashboard Metrics

### Core Tiles

- [ ] **Active Jobs**: Display count of mandates currently being worked on
- [ ] **My Candidates**: Show count of candidates sourced by the user; clicking navigates to application list view
- [ ] **In Process**: Filtered view of applications with status 'In Process'
- [ ] **Select**: Filtered view of applications where offer has been released
- [ ] **Joined**: Filtered view of applications for joined candidates
- [ ] **Billed Amount This Quarter**: Calculate based on job mandates (typically 8.33% of annual CTC, but configurable)

### Role-Based Enhancements

#### For Recruiter (Execution Role)

- [ ] **Daily Call Funnel Chart**: Bar chart showing Calls Made → Interested → Sourced conversion rate
- [ ] **Upcoming Interviews List**: Display candidates scheduled for interviews today/tomorrow
- [ ] **Stagnant Applications List**: Show candidates with no status change in >48 hours

#### For TL/Manager (Strategy Role)

- [ ] **Recruiter Leaderboard**: Ranking of team members by sources or interviews this week
- [ ] **Job Load Balance Chart**: Visualize which jobs are over/under-serviced
- [ ] **Yield Ratio Analysis**: Track which recruiters are closing deals vs. sending high volume

#### For Admin/Owner (Governance Role)

- [ ] **Pipeline Value Forecast**: Weighted revenue calculation based on application stages
- [ ] **Client Concentration Pie Chart**: Show business distribution across clients

## Top Bar Organization

### Left Side: The Engine (Daily Actions)

- [ ] **Dashboard**: Main home base view
- [ ] **My Desk Dropdown**:
  - [ ] My Call Logs (interaction history)
  - [ ] My Applications (personal candidates view)
  - [ ] My Interview Calendar
- [ ] **Jobs**: Master list of mandates
- [ ] **Candidates**: Master talent database

### Center: Global Search

- [ ] **Search Bar**: Support searching by Phone Number, Email, or Candidate Name

### Right Side: Command Center (Role-Dependent)

- [x] **Management Dropdown** (TL/Admin only):
  - [ ] Team Activity feed (placeholder)
  - [x] Add user (Admin/Manager only) - `/users/add`
  - [x] Manage Users: can either change role or revoke access - `/users`
  - [x] Job Allocation interface - `/jobs/allocate`
    - TL: Assign to TL and users assigned to TL
    - Manager: Assign to Manager or Team or User
    - Admin: Assign to Manager or Team or User
    - If assigning to TL: Checkbox "assign to team?"
  - [ ] Summary Reports (placeholder)
- [ ] **Quick Actions**:
  - [ ] One-click add New Candidate
  - [ ] One-click add New Job
  - [ ] View My Call Sheet
- [ ] **Profile/Settings**: Personal info and password management

## Implementation Notes

- Distinguish between Execution (Recruiter), Strategy (TL/Manager), and Governance (Admin) roles
- Ensure role-based access control for features
- Use charts and visualizations for better UX (bar charts, pie charts, etc.)
- Implement navigation logic for clickable tiles and lists
- Consider performance for real-time data and large datasets</content>
  <parameter name="filePath">c:\Users\anura\Desktop\TalentMason\recruiting-app\tasks.md
