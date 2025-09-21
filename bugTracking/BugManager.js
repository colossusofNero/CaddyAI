/**
 * Bug Manager - Core bug tracking and workflow management system
 */

const { bugTrackingSystem } = require('./bugTrackingSystem');
const { EventEmitter } = require('events');

class BugManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      database: config.database || 'mongodb://localhost:27017/caddyai_bugs',
      integrations: config.integrations || {},
      notifications: config.notifications || {},
      automatedDetection: config.automatedDetection !== false,
      slaMonitoring: config.slaMonitoring !== false,
      ...config
    };

    this.bugs = new Map();
    this.workflows = new Map();
    this.teams = new Map();
    this.metrics = new Map();
    this.integrationServices = new Map();

    this.initialize();
  }

  async initialize() {
    // Initialize database connection
    await this.initializeDatabase();

    // Set up integrations
    await this.initializeIntegrations();

    // Start monitoring services
    await this.startMonitoringServices();

    // Initialize teams and workflows
    this.initializeTeamsAndWorkflows();

    this.emit('initialized');
    console.log('Bug Manager initialized successfully');
  }

  /**
   * Create a new bug report
   */
  async createBug(bugData) {
    const bug = {
      id: this.generateBugId(),
      title: bugData.title,
      description: bugData.description,
      severity: bugData.severity || 'medium',
      priority: this.calculatePriority(bugData),
      category: bugData.category,
      component: bugData.component,
      reporter: bugData.reporter,
      device: bugData.device || {},
      environment: bugData.environment || {},
      steps: bugData.steps || [],
      expected: bugData.expected || '',
      actual: bugData.actual || '',
      attachments: bugData.attachments || [],

      // Workflow fields
      status: 'new',
      assignee: null,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),

      // Classification fields
      labels: [],
      milestone: null,
      epic: null,

      // Tracking fields
      timeSpent: 0,
      estimatedTime: null,

      // History
      history: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        user: bugData.reporter,
        details: 'Bug created'
      }]
    };

    // Validate bug data
    this.validateBugData(bug);

    // Auto-classify bug
    await this.autoClassifyBug(bug);

    // Store bug
    this.bugs.set(bug.id, bug);
    await this.saveBugToDatabase(bug);

    // Trigger workflow
    await this.triggerWorkflowTransition(bug, 'create');

    // Send notifications
    await this.sendNotifications('bug_created', bug);

    // Update metrics
    this.updateMetrics('bug_created', bug);

    this.emit('bug_created', bug);
    return bug;
  }

  /**
   * Update existing bug
   */
  async updateBug(bugId, updates) {
    const bug = this.bugs.get(bugId);
    if (!bug) {
      throw new Error(`Bug ${bugId} not found`);
    }

    const originalStatus = bug.status;
    const originalAssignee = bug.assignee;

    // Apply updates
    Object.assign(bug, updates, {
      updated: new Date().toISOString()
    });

    // Add to history
    bug.history.push({
      action: 'updated',
      timestamp: new Date().toISOString(),
      user: updates.updatedBy,
      changes: this.getChangesSummary(bug, updates),
      details: updates.comment || 'Bug updated'
    });

    // Check for workflow transitions
    if (updates.status && updates.status !== originalStatus) {
      await this.validateWorkflowTransition(bug, originalStatus, updates.status);
    }

    // Check for assignment changes
    if (updates.assignee && updates.assignee !== originalAssignee) {
      await this.handleAssignmentChange(bug, originalAssignee, updates.assignee);
    }

    // Update database
    await this.saveBugToDatabase(bug);

    // Send notifications
    await this.sendNotifications('bug_updated', bug, { updates, originalStatus, originalAssignee });

    // Update metrics
    this.updateMetrics('bug_updated', bug);

    this.emit('bug_updated', bug, updates);
    return bug;
  }

  /**
   * Transition bug through workflow
   */
  async transitionBug(bugId, newStatus, transitionData = {}) {
    const bug = this.bugs.get(bugId);
    if (!bug) {
      throw new Error(`Bug ${bugId} not found`);
    }

    const oldStatus = bug.status;

    // Validate transition
    await this.validateWorkflowTransition(bug, oldStatus, newStatus);

    // Execute pre-transition actions
    await this.executePreTransitionActions(bug, oldStatus, newStatus, transitionData);

    // Update bug status
    bug.status = newStatus;
    bug.updated = new Date().toISOString();

    // Add to history
    bug.history.push({
      action: 'status_changed',
      timestamp: new Date().toISOString(),
      user: transitionData.user,
      from: oldStatus,
      to: newStatus,
      details: transitionData.comment || `Status changed from ${oldStatus} to ${newStatus}`
    });

    // Execute post-transition actions
    await this.executePostTransitionActions(bug, oldStatus, newStatus, transitionData);

    // Update database
    await this.saveBugToDatabase(bug);

    // Send notifications
    await this.sendNotifications('bug_transitioned', bug, { oldStatus, newStatus });

    // Update metrics
    this.updateMetrics('bug_transitioned', bug);

    this.emit('bug_transitioned', bug, { oldStatus, newStatus });
    return bug;
  }

  /**
   * Auto-classify bug based on content analysis
   */
  async autoClassifyBug(bug) {
    // Analyze title and description for keywords
    const content = `${bug.title} ${bug.description}`.toLowerCase();

    // Determine category
    if (!bug.category) {
      bug.category = this.detectCategory(content);
    }

    // Determine component
    if (!bug.component) {
      bug.component = this.detectComponent(content);
    }

    // Auto-assign labels
    bug.labels = this.generateLabels(bug, content);

    // Determine severity if not set
    if (bug.severity === 'medium') {
      bug.severity = this.detectSeverity(content);
    }

    // Auto-assign to team
    if (!bug.assignee) {
      const team = this.getResponsibleTeam(bug.category);
      if (team && team.members.length > 0) {
        bug.assignee = this.selectTeamMember(team, bug);
      }
    }
  }

  detectCategory(content) {
    const categoryKeywords = {
      voice_processing: ['voice', 'speech', 'recognition', 'command', 'microphone', 'audio'],
      calculations: ['calculation', 'distance', 'club', 'recommendation', 'math', 'algorithm'],
      gps_location: ['gps', 'location', 'coordinates', 'mapping', 'position'],
      user_interface: ['ui', 'button', 'screen', 'layout', 'display', 'interface'],
      performance: ['slow', 'fast', 'performance', 'memory', 'battery', 'crash'],
      device_compatibility: ['device', 'android', 'ios', 'compatibility', 'version']
    };

    let bestMatch = 'user_interface'; // default
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (content.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    }

    return bestMatch;
  }

  detectComponent(content) {
    const componentKeywords = {
      voice_engine: ['voice', 'speech', 'recognition', 'command processing'],
      calculation_engine: ['calculation', 'distance', 'club recommendation', 'wind'],
      gps_service: ['gps', 'location', 'coordinates', 'positioning'],
      ui_framework: ['ui', 'interface', 'screen', 'component'],
      data_layer: ['data', 'storage', 'sync', 'database']
    };

    for (const [component, keywords] of Object.entries(componentKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return component;
      }
    }

    return 'ui_framework'; // default
  }

  detectSeverity(content) {
    const severityKeywords = {
      critical: ['crash', 'freeze', 'data loss', 'security', 'unusable'],
      high: ['broken', 'wrong', 'incorrect', 'major', 'significant'],
      medium: ['minor', 'small', 'sometimes', 'occasionally'],
      low: ['typo', 'cosmetic', 'enhancement', 'suggestion']
    };

    for (const [severity, keywords] of Object.entries(severityKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return severity;
      }
    }

    return 'medium'; // default
  }

  generateLabels(bug, content) {
    const labels = [];

    // Add category label
    labels.push(bug.category);

    // Add severity label
    labels.push(`severity:${bug.severity}`);

    // Add device-specific labels
    if (bug.device && bug.device.platform) {
      labels.push(`platform:${bug.device.platform}`);
    }

    // Add feature-specific labels
    if (content.includes('voice')) labels.push('voice');
    if (content.includes('gps')) labels.push('gps');
    if (content.includes('calculation')) labels.push('calculation');
    if (content.includes('ui')) labels.push('ui');

    return [...new Set(labels)]; // Remove duplicates
  }

  calculatePriority(bugData) {
    let priority = 'p2'; // default

    // High priority for critical bugs
    if (bugData.severity === 'critical') {
      priority = 'p0';
    } else if (bugData.severity === 'high') {
      priority = 'p1';
    } else if (bugData.severity === 'low') {
      priority = 'p3';
    }

    // Adjust based on user impact
    if (bugData.userImpact === 'all_users') {
      priority = priority === 'p3' ? 'p2' : priority;
      priority = priority === 'p2' ? 'p1' : priority;
    }

    // Adjust based on business impact
    if (bugData.businessImpact === 'blocking_release') {
      priority = 'p0';
    }

    return priority;
  }

  /**
   * Workflow validation and execution
   */
  async validateWorkflowTransition(bug, fromStatus, toStatus) {
    const workflow = bugTrackingSystem.workflow;
    const currentState = workflow.states[fromStatus];

    if (!currentState) {
      throw new Error(`Invalid current status: ${fromStatus}`);
    }

    if (!currentState.nextStates.includes(toStatus)) {
      throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
    }

    // Check permissions
    const transition = workflow.transitions.find(t =>
      t.from === fromStatus && t.to === toStatus
    );

    if (transition && transition.permissions) {
      // In a real implementation, check user permissions here
      // For now, we'll assume permissions are valid
    }

    return true;
  }

  async executePreTransitionActions(bug, fromStatus, toStatus, transitionData) {
    const workflow = bugTrackingSystem.workflow;
    const targetState = workflow.states[toStatus];

    if (targetState.autoActions) {
      for (const action of targetState.autoActions) {
        await this.executeAutomatedAction(bug, action, transitionData);
      }
    }
  }

  async executePostTransitionActions(bug, fromStatus, toStatus, transitionData) {
    // Update SLA timers
    await this.updateSLATracking(bug, toStatus);

    // Check for escalation conditions
    await this.checkEscalationRules(bug);

    // Trigger integration updates
    await this.syncWithIntegrations(bug, 'status_change');
  }

  async executeAutomatedAction(bug, action, transitionData) {
    switch (action) {
      case 'assign_triage':
        const triageTeam = this.teams.get('triage_team');
        if (triageTeam && triageTeam.members.length > 0) {
          bug.assignee = triageTeam.members[0]; // Simple round-robin
        }
        break;

      case 'send_acknowledgment':
        await this.sendNotifications('bug_acknowledged', bug);
        break;

      case 'notify_assignee':
        if (bug.assignee) {
          await this.sendNotifications('bug_assigned', bug);
        }
        break;

      case 'request_review':
        await this.requestCodeReview(bug);
        break;

      case 'deploy_to_test':
        await this.deployToTestEnvironment(bug);
        break;

      case 'run_automated_tests':
        await this.runAutomatedTests(bug);
        break;

      default:
        console.warn(`Unknown automated action: ${action}`);
    }
  }

  /**
   * SLA and escalation management
   */
  async updateSLATracking(bug, newStatus) {
    const slaConfig = bugTrackingSystem.sla;
    const severity = bug.severity;

    // Calculate response time
    if (!bug.responseTime && newStatus !== 'new') {
      bug.responseTime = Date.now() - new Date(bug.created).getTime();
    }

    // Calculate resolution time
    if (newStatus === 'closed' && !bug.resolutionTime) {
      bug.resolutionTime = Date.now() - new Date(bug.created).getTime();
    }

    // Check SLA breaches
    const responseTimeSLA = this.parseDuration(slaConfig.response_times[severity]);
    const resolutionTimeSLA = this.parseDuration(slaConfig.resolution_times[severity]);

    if (bug.responseTime && bug.responseTime > responseTimeSLA) {
      bug.slaBreaches = bug.slaBreaches || [];
      bug.slaBreaches.push({
        type: 'response_time',
        timestamp: new Date().toISOString(),
        slaTime: responseTimeSLA,
        actualTime: bug.responseTime
      });
    }

    if (bug.resolutionTime && bug.resolutionTime > resolutionTimeSLA) {
      bug.slaBreaches = bug.slaBreaches || [];
      bug.slaBreaches.push({
        type: 'resolution_time',
        timestamp: new Date().toISOString(),
        slaTime: resolutionTimeSLA,
        actualTime: bug.resolutionTime
      });
    }
  }

  async checkEscalationRules(bug) {
    const escalationRules = bugTrackingSystem.sla.escalation_rules;

    for (const rule of escalationRules) {
      if (this.evaluateEscalationCondition(bug, rule.condition)) {
        await this.executeEscalationAction(bug, rule.action, rule.notification);
      }
    }
  }

  evaluateEscalationCondition(bug, condition) {
    const now = Date.now();
    const created = new Date(bug.created).getTime();
    const timeSinceCreation = now - created;

    switch (condition) {
      case 'critical_bug_no_response_2_hours':
        return bug.severity === 'critical' &&
               bug.status === 'new' &&
               timeSinceCreation > 2 * 60 * 60 * 1000; // 2 hours

      case 'high_bug_no_progress_1_day':
        return bug.severity === 'high' &&
               bug.status === 'assigned' &&
               timeSinceCreation > 24 * 60 * 60 * 1000; // 1 day

      case 'bug_reopened_3_times':
        return bug.history.filter(h => h.action === 'reopened').length >= 3;

      case 'critical_bug_missed_sla':
        return bug.severity === 'critical' &&
               bug.slaBreaches &&
               bug.slaBreaches.length > 0;

      default:
        return false;
    }
  }

  async executeEscalationAction(bug, action, notifications) {
    console.log(`Escalating bug ${bug.id} - ${action}`);

    // Add escalation to bug history
    bug.history.push({
      action: 'escalated',
      timestamp: new Date().toISOString(),
      escalationType: action,
      details: `Bug escalated due to ${action}`
    });

    // Send escalation notifications
    for (const notificationType of notifications) {
      await this.sendEscalationNotification(bug, action, notificationType);
    }

    // Update bug priority if needed
    if (action.includes('critical')) {
      bug.priority = 'p0';
    }
  }

  /**
   * Team and assignment management
   */
  getResponsibleTeam(category) {
    const teamAssignments = {
      voice_processing: 'voice_team',
      calculations: 'algorithm_team',
      gps_location: 'platform_team',
      user_interface: 'frontend_team',
      performance: 'platform_team',
      device_compatibility: 'platform_team',
      data_management: 'backend_team'
    };

    const teamName = teamAssignments[category];
    return teamName ? bugTrackingSystem.teams[teamName] : null;
  }

  selectTeamMember(team, bug) {
    // Simple round-robin assignment
    // In production, this would consider workload, expertise, availability
    const memberIndex = bug.id.charCodeAt(bug.id.length - 1) % team.members.length;
    return team.members[memberIndex];
  }

  async handleAssignmentChange(bug, oldAssignee, newAssignee) {
    // Log assignment change
    bug.history.push({
      action: 'reassigned',
      timestamp: new Date().toISOString(),
      from: oldAssignee,
      to: newAssignee,
      details: `Bug reassigned from ${oldAssignee} to ${newAssignee}`
    });

    // Notify old and new assignees
    if (oldAssignee) {
      await this.sendNotifications('bug_unassigned', bug, { assignee: oldAssignee });
    }
    if (newAssignee) {
      await this.sendNotifications('bug_assigned', bug, { assignee: newAssignee });
    }
  }

  /**
   * Metrics and reporting
   */
  updateMetrics(eventType, bug, additionalData = {}) {
    const today = new Date().toISOString().split('T')[0];

    if (!this.metrics.has(today)) {
      this.metrics.set(today, {
        bugs_created: 0,
        bugs_resolved: 0,
        bugs_by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
        bugs_by_category: {},
        response_times: [],
        resolution_times: [],
        sla_breaches: 0
      });
    }

    const todayMetrics = this.metrics.get(today);

    switch (eventType) {
      case 'bug_created':
        todayMetrics.bugs_created++;
        todayMetrics.bugs_by_severity[bug.severity]++;
        todayMetrics.bugs_by_category[bug.category] =
          (todayMetrics.bugs_by_category[bug.category] || 0) + 1;
        break;

      case 'bug_resolved':
        todayMetrics.bugs_resolved++;
        if (bug.resolutionTime) {
          todayMetrics.resolution_times.push(bug.resolutionTime);
        }
        break;

      case 'sla_breach':
        todayMetrics.sla_breaches++;
        break;
    }

    this.emit('metrics_updated', { date: today, metrics: todayMetrics });
  }

  async generateMetricsReport(dateRange) {
    const reports = [];

    for (const [date, metrics] of this.metrics) {
      if (this.isDateInRange(date, dateRange)) {
        reports.push({ date, ...metrics });
      }
    }

    return {
      period: dateRange,
      reports,
      summary: this.calculateMetricsSummary(reports)
    };
  }

  calculateMetricsSummary(reports) {
    return {
      totalBugsCreated: reports.reduce((sum, r) => sum + r.bugs_created, 0),
      totalBugsResolved: reports.reduce((sum, r) => sum + r.bugs_resolved, 0),
      averageResponseTime: this.calculateAverage(
        reports.flatMap(r => r.response_times)
      ),
      averageResolutionTime: this.calculateAverage(
        reports.flatMap(r => r.resolution_times)
      ),
      totalSlaBreaches: reports.reduce((sum, r) => sum + r.sla_breaches, 0)
    };
  }

  /**
   * Integration management
   */
  async initializeIntegrations() {
    const integrationConfigs = bugTrackingSystem.integrations;

    for (const [name, config] of Object.entries(integrationConfigs)) {
      if (config.enabled) {
        const service = await this.createIntegrationService(name, config);
        this.integrationServices.set(name, service);
      }
    }
  }

  async createIntegrationService(name, config) {
    // Factory pattern for creating integration services
    switch (name) {
      case 'jira':
        return new JiraIntegrationService(config);
      case 'slack':
        return new SlackIntegrationService(config);
      case 'github':
        return new GitHubIntegrationService(config);
      default:
        return new MockIntegrationService(config);
    }
  }

  async syncWithIntegrations(bug, eventType) {
    for (const [name, service] of this.integrationServices) {
      try {
        await service.syncBug(bug, eventType);
      } catch (error) {
        console.error(`Failed to sync bug with ${name}:`, error);
      }
    }
  }

  async sendNotifications(eventType, bug, additionalData = {}) {
    const slackService = this.integrationServices.get('slack');
    if (slackService) {
      await slackService.sendNotification(eventType, bug, additionalData);
    }

    // Send email notifications
    await this.sendEmailNotifications(eventType, bug, additionalData);
  }

  /**
   * Utility methods
   */
  generateBugId() {
    return `CAI-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  validateBugData(bug) {
    if (!bug.title) {
      throw new Error('Bug title is required');
    }
    if (!bug.description) {
      throw new Error('Bug description is required');
    }
    if (!bug.reporter) {
      throw new Error('Bug reporter is required');
    }
  }

  getChangesSummary(bug, updates) {
    const changes = [];
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'updatedBy' && key !== 'comment' && bug[key] !== value) {
        changes.push(`${key}: ${bug[key]} → ${value}`);
      }
    }
    return changes.join(', ');
  }

  parseDuration(duration) {
    const units = { hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 };
    const match = duration.match(/(\d+)\s*(hour|day|week|month)s?/);
    if (match) {
      return parseInt(match[1]) * units[match[2]];
    }
    return 86400000; // Default to 1 day
  }

  calculateAverage(numbers) {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }

  isDateInRange(date, range) {
    // Simple date range check - implement as needed
    return true;
  }

  // Placeholder methods for integration points
  async initializeDatabase() { console.log('Database initialized'); }
  async saveBugToDatabase(bug) { console.log(`Saved bug ${bug.id} to database`); }
  async startMonitoringServices() { console.log('Monitoring services started'); }
  async requestCodeReview(bug) { console.log(`Requested code review for bug ${bug.id}`); }
  async deployToTestEnvironment(bug) { console.log(`Deployed fix for bug ${bug.id} to test`); }
  async runAutomatedTests(bug) { console.log(`Running automated tests for bug ${bug.id}`); }
  async sendEscalationNotification(bug, action, type) { console.log(`Sent ${type} escalation notification for bug ${bug.id}`); }
  async sendEmailNotifications(eventType, bug, data) { console.log(`Sent email notification: ${eventType} for bug ${bug.id}`); }

  initializeTeamsAndWorkflows() {
    // Initialize teams from configuration
    for (const [teamName, teamConfig] of Object.entries(bugTrackingSystem.teams)) {
      this.teams.set(teamName, teamConfig);
    }
  }
}

// Mock integration service classes
class MockIntegrationService {
  constructor(config) { this.config = config; }
  async syncBug(bug, eventType) { console.log(`Mock sync: ${bug.id} - ${eventType}`); }
}

class JiraIntegrationService extends MockIntegrationService {
  async syncBug(bug, eventType) {
    console.log(`Syncing bug ${bug.id} with JIRA - ${eventType}`);
    // Implement JIRA API calls
  }
}

class SlackIntegrationService extends MockIntegrationService {
  async syncBug(bug, eventType) {
    console.log(`Syncing bug ${bug.id} with Slack - ${eventType}`);
  }

  async sendNotification(eventType, bug, additionalData) {
    const channel = this.getChannelForEvent(eventType, bug);
    const message = this.formatSlackMessage(eventType, bug, additionalData);
    console.log(`Slack notification to ${channel}: ${message}`);
    // Implement Slack API call
  }

  getChannelForEvent(eventType, bug) {
    if (bug.severity === 'critical') return '#critical-bugs';
    if (eventType.includes('assigned')) return '#bug-reports';
    return '#qa-updates';
  }

  formatSlackMessage(eventType, bug, data) {
    return `${eventType}: Bug ${bug.id} - ${bug.title} (${bug.severity})`;
  }
}

class GitHubIntegrationService extends MockIntegrationService {
  async syncBug(bug, eventType) {
    console.log(`Syncing bug ${bug.id} with GitHub - ${eventType}`);
    // Implement GitHub Issues API calls
  }
}

module.exports = { BugManager };