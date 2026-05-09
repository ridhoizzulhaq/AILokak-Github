export type PackId = 'behavioral-core' | 'leadership-fundamentals' | 'situational-judgment' | 'software-engineering'

const CATEGORY_TO_PACK: Record<string, PackId> = {
  behavioral: 'behavioral-core',
  leadership: 'leadership-fundamentals',
  situational: 'situational-judgment',
  technical: 'software-engineering',
}

interface RawQuestion {
  category: 'behavioral' | 'leadership' | 'situational' | 'technical'
  question: string
  ideal_answer: string
  evaluation_criteria: string
}

export interface InterviewQuestion extends RawQuestion {
  packId: PackId
}

const rawQuestions: RawQuestion[] = [
  // BEHAVIORAL
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to deal with a difficult coworker.',
    ideal_answer:
      'Use STAR: Describe the specific conflict situation briefly, explain your role and responsibility, detail the concrete steps you took to resolve it (active listening, direct conversation, involving manager if needed), and share the positive outcome — improved collaboration or lesson learned.',
    evaluation_criteria:
      'Specific example, conflict resolution skills, professional tone, outcome focus, no blame language'
  },
  {
    category: 'behavioral',
    question: 'Describe a situation where you had to meet a tight deadline.',
    ideal_answer:
      'STAR: Set the scene (project scope, deadline), explain your prioritization strategy, describe how you managed time/resources/stakeholders, and quantify the result (delivered on time, quality maintained).',
    evaluation_criteria: 'Prioritization skills, time management, concrete actions, measurable outcome'
  },
  {
    category: 'behavioral',
    question: 'Give me an example of a goal you set and how you achieved it.',
    ideal_answer:
      'STAR: State a specific, measurable goal, explain your planning approach (breaking into milestones), describe obstacles and how you overcame them, share the final result with numbers if possible.',
    evaluation_criteria: 'Goal specificity, planning, perseverance, measurable result'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you failed and what you learned from it.',
    ideal_answer:
      'STAR: Honestly describe the failure, take ownership without excuses, explain what went wrong and why, focus heavily on the lesson learned and how you applied it afterward.',
    evaluation_criteria: 'Self-awareness, accountability, growth mindset, no blame-shifting'
  },
  {
    category: 'behavioral',
    question: 'Describe a time you went above and beyond your job responsibilities.',
    ideal_answer:
      'STAR: Explain the situation and why extra effort was needed, describe actions beyond your role, highlight the positive impact on team or company, keep motivation focused on team success not personal gain.',
    evaluation_criteria: 'Initiative, teamwork, impact, genuine motivation'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to adapt to a significant change at work.',
    ideal_answer:
      'STAR: Describe the change (reorg, new technology, pivot), explain your initial reaction honestly, detail adaptation steps (learning, seeking help, adjusting habits), share how you contributed positively through the transition.',
    evaluation_criteria: 'Adaptability, positive attitude, concrete actions, contribution during change'
  },
  {
    category: 'behavioral',
    question: 'Give an example of when you had to work with someone very different from you.',
    ideal_answer:
      'STAR: Describe the difference (work style, background, opinion), explain how you found common ground, detail collaboration strategies, share the outcome and what you learned about diverse teams.',
    evaluation_criteria: 'Collaboration, empathy, communication, valuing diversity'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to make a decision with incomplete information.',
    ideal_answer:
      'STAR: Set context for urgency and information gap, explain your decision framework (risk assessment, stakeholder input, best available data), describe the decision made, share outcome and what you would do differently.',
    evaluation_criteria: 'Decision-making under uncertainty, structured thinking, risk awareness'
  },
  {
    category: 'behavioral',
    question: 'Describe a situation where you had to persuade someone to see things your way.',
    ideal_answer:
      'STAR: Explain the disagreement context, describe how you understood their perspective first, detail your persuasion approach (data, story, listening), share how consensus was reached.',
    evaluation_criteria: 'Influence skills, empathy, data-driven approach, collaborative resolution'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you received critical feedback. How did you respond?',
    ideal_answer:
      'STAR: Describe the feedback context, explain your immediate reaction (even if defensive initially — honesty helps), detail how you processed and acted on it, share measurable improvement.',
    evaluation_criteria: 'Receptiveness to feedback, emotional maturity, action taken, growth shown'
  },
  {
    category: 'behavioral',
    question: 'Give an example of when you managed multiple priorities simultaneously.',
    ideal_answer:
      'STAR: Describe the competing priorities and stakes, explain prioritization method (impact vs effort, deadlines, stakeholder alignment), detail execution, share how all or key priorities were met.',
    evaluation_criteria: 'Prioritization framework, organization, communication, outcomes'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to learn something new quickly.',
    ideal_answer:
      'STAR: Name the skill/technology, explain the time constraint, describe your learning strategy (resources, practice, mentorship), show how you applied it successfully.',
    evaluation_criteria: 'Learning agility, resourcefulness, speed of application, outcome'
  },

  // LEADERSHIP
  {
    category: 'leadership',
    question: 'Tell me about a time you led a team through a difficult project.',
    ideal_answer:
      'STAR: Describe project difficulty (scope, conflict, uncertainty), explain your leadership approach (clear goals, delegation, motivation, removing blockers), share team outcome and your key decisions.',
    evaluation_criteria: 'Leadership style, problem solving, team motivation, project outcome'
  },
  {
    category: 'leadership',
    question: 'Describe a situation where you had to motivate a demotivated team.',
    ideal_answer:
      'STAR: Diagnose root cause of demotivation (unclear goals, overwork, conflict), describe interventions (1:1s, clarifying purpose, removing obstacles, celebrating wins), share improvement in team morale and performance.',
    evaluation_criteria: 'Empathy, root cause analysis, concrete actions, measurable morale improvement'
  },
  {
    category: 'leadership',
    question: 'Tell me about a time you had to give difficult feedback to a team member.',
    ideal_answer:
      'STAR: Set up context (performance issue, behavior concern), explain your preparation and delivery approach (specific, timely, private, solution-focused), describe the conversation and follow-up, share outcome.',
    evaluation_criteria: 'Courage, specificity, empathy, follow-through, outcome'
  },
  {
    category: 'leadership',
    question: 'Give an example of a decision you made as a leader that was unpopular.',
    ideal_answer:
      'STAR: Describe the decision and why it was unpopular, explain your reasoning process and consultation, detail how you communicated it transparently, share the long-term outcome that validated the decision.',
    evaluation_criteria: 'Decisiveness, transparency, stakeholder management, conviction with humility'
  },
  {
    category: 'leadership',
    question: 'Tell me about a time you successfully delegated an important task.',
    ideal_answer:
      'STAR: Explain why delegation was appropriate, describe how you selected the right person, detail how you set clear expectations and provided support without micromanaging, share the successful outcome.',
    evaluation_criteria: 'Trust, clear communication, appropriate oversight, development of others'
  },
  {
    category: 'leadership',
    question: 'Describe how you have developed someone on your team.',
    ideal_answer:
      'STAR: Identify the team member and development opportunity, explain coaching approach (stretch assignments, feedback loops, mentorship), share specific growth achieved (promotion, new skills, increased ownership).',
    evaluation_criteria: 'Coaching skill, patience, specific development actions, measurable growth'
  },
  {
    category: 'leadership',
    question: 'Tell me about a time you had to manage conflict within your team.',
    ideal_answer:
      'STAR: Describe conflict nature and impact on team, explain how you diagnosed the root cause, detail mediation approach (bring parties together, focus on shared goals, establish agreements), share resolution.',
    evaluation_criteria: 'Conflict resolution, neutrality, root cause focus, team cohesion outcome'
  },
  {
    category: 'leadership',
    question: 'Give an example of how you built a high-performing team.',
    ideal_answer:
      'STAR: Describe starting state, explain strategies (hiring for diversity, clear roles, psychological safety, process improvement, recognition), share concrete performance metrics that improved.',
    evaluation_criteria: 'Strategic thinking, culture building, measurable team performance improvement'
  },

  // SITUATIONAL
  {
    category: 'situational',
    question: 'What would you do if you disagreed with your manager\'s decision?',
    ideal_answer:
      'First seek to understand the full context and reasoning behind the decision. Then share your perspective privately and constructively with data or examples. If after discussion you still disagree but the decision stands, commit to executing it professionally. Escalate only if it involves ethical concerns.',
    evaluation_criteria: 'Respect for authority, constructive communication, data use, professional commitment'
  },
  {
    category: 'situational',
    question: 'How would you handle a situation where your project is behind schedule?',
    ideal_answer:
      'Immediately assess scope of delay and root cause. Communicate transparently to stakeholders early. Propose options: scope reduction, resource addition, deadline extension with trade-off analysis. Create recovery plan with daily checkpoints. Prevent recurrence by addressing root cause.',
    evaluation_criteria: 'Transparency, problem solving, stakeholder communication, recovery planning'
  },
  {
    category: 'situational',
    question: 'What would you do if a colleague was taking credit for your work?',
    ideal_answer:
      'First have a direct, private conversation with the colleague to clarify expectations about attribution. Document contributions going forward. If it continues, involve manager with factual evidence. Focus on establishing better team norms, not punishing.',
    evaluation_criteria: 'Direct communication, evidence-based, escalation path, focus on norms not revenge'
  },
  {
    category: 'situational',
    question: 'How would you handle two equally urgent tasks with the same deadline?',
    ideal_answer:
      'Immediately escalate to manager or relevant stakeholders to align on true priority. If no guidance available, assess by business impact and dependency — which blocks others? Communicate transparently about trade-offs. Negotiate for either deadline extension or resource help.',
    evaluation_criteria: 'Escalation instinct, impact assessment, transparency, negotiation'
  },
  {
    category: 'situational',
    question: 'What would you do if you noticed a colleague was struggling but not asking for help?',
    ideal_answer:
      'Approach them privately and empathetically — ask open-ended questions, share observation without judgment. Offer specific help rather than generic offers. Respect autonomy if they decline. If performance impacts team or suggests serious issue, loop in manager appropriately.',
    evaluation_criteria: 'Empathy, proactiveness, appropriate escalation, respect for autonomy'
  },
  {
    category: 'situational',
    question: 'How would you approach a new role in the first 90 days?',
    ideal_answer:
      'Days 1-30: listen and learn — understand team dynamics, existing processes, stakeholder expectations, avoid changing things. Days 31-60: identify quick wins and build relationships. Days 61-90: propose improvements based on evidence, start executing with team buy-in.',
    evaluation_criteria: 'Structured approach, listening first, relationship building, thoughtful change management'
  },
  {
    category: 'situational',
    question: 'What would you do if a customer was extremely angry and unreasonable?',
    ideal_answer:
      'Stay calm, let them vent fully without interrupting. Acknowledge their frustration genuinely ("I understand why this is frustrating"). Clarify the actual issue beneath the emotion. Offer concrete next steps within your authority. Escalate if needed but stay owner of the resolution.',
    evaluation_criteria: 'Emotional regulation, empathy, de-escalation, problem-solving focus'
  },
  {
    category: 'situational',
    question: 'How would you handle a situation where you made a significant mistake at work?',
    ideal_answer:
      'Immediately acknowledge the mistake to relevant stakeholders — no hiding or minimizing. Assess impact and urgency of fix. Propose a concrete remediation plan. Implement fix. Do root cause analysis to prevent recurrence. Follow up with affected parties.',
    evaluation_criteria: 'Accountability, speed, transparency, remediation focus, prevention mindset'
  },
  {
    category: 'situational',
    question: 'What would you do if asked to do something that conflicts with your values?',
    ideal_answer:
      'Clarify intent — sometimes misunderstanding context changes perception. If genuinely conflicts with values, express concern privately and clearly with reasoning. Suggest alternatives. If non-negotiable ethical violation, escalate through proper channels (HR, ethics hotline). Document everything.',
    evaluation_criteria: 'Clarity before reaction, courage, proper escalation, documentation'
  },
  {
    category: 'situational',
    question: 'How would you prioritize tasks if everything is marked as urgent?',
    ideal_answer:
      'Clarify true urgency with stakeholders — "urgent" is often overused. Use impact × effort matrix: high impact, low effort first. Identify what is blocking others. Communicate capacity constraints transparently. Push back on low-value urgent tasks with data.',
    evaluation_criteria: 'Prioritization framework, stakeholder communication, capacity awareness, assertiveness'
  },

  // TECHNICAL / PROBLEM SOLVING
  {
    category: 'technical',
    question: 'Describe your approach to debugging a complex problem you\'ve never seen before.',
    ideal_answer:
      'Reproduce the issue reliably first. Gather all error messages, logs, and context. Form a hypothesis about root cause. Test hypothesis systematically — change one variable at a time. Use divide-and-conquer to narrow scope. Document findings as you go. Ask for help after exhausting own approaches.',
    evaluation_criteria: 'Systematic approach, hypothesis-driven, documentation, knowing when to ask for help'
  },
  {
    category: 'technical',
    question: 'How do you ensure the quality of your work?',
    ideal_answer:
      'Write tests before or alongside code. Code review — both give and receive. Follow established standards and linting. Test edge cases and failure modes explicitly. Get feedback early on approach before full implementation. Leave code better than you found it.',
    evaluation_criteria: 'Testing mindset, code review culture, standards, edge case awareness'
  },
  {
    category: 'technical',
    question: 'Tell me about the most complex technical problem you have solved.',
    ideal_answer:
      'STAR: Describe the technical complexity clearly (scale, ambiguity, constraints). Explain your investigation and solution design process. Detail implementation challenges. Share measurable outcome — performance improvement, reliability increase, cost reduction.',
    evaluation_criteria: 'Technical depth, structured problem solving, clear communication, measurable impact'
  },
  {
    category: 'technical',
    question: 'How do you stay current with new technologies and industry trends?',
    ideal_answer:
      'Consistent habits: follow key publications and newsletters, maintain a learning project to apply new concepts, attend conferences or watch talks, participate in community (GitHub, forums), pair with others who know different things, set aside dedicated learning time each week.',
    evaluation_criteria: 'Concrete habits, curiosity, application of learning, community engagement'
  },
  {
    category: 'technical',
    question: 'Describe a time you had to make a technical trade-off. How did you decide?',
    ideal_answer:
      'STAR: Name the trade-off (speed vs quality, build vs buy, consistency vs performance). Explain evaluation criteria (business timeline, maintenance burden, team skill, risk). Describe decision made with explicit reasoning. Share outcome and whether the trade-off held up.',
    evaluation_criteria: 'Structured trade-off analysis, context awareness, decision documentation, outcome reflection'
  },
  {
    category: 'technical',
    question: 'How do you approach learning a new codebase or technical domain?',
    ideal_answer:
      'Start with high-level architecture documentation. Run it locally and explore from the entry point. Read tests — they document behavior. Make small changes and observe effects. Ask targeted questions to domain experts. Draw diagrams to build mental model. Contribute small fixes first.',
    evaluation_criteria: 'Structured approach, curiosity, test-reading habit, targeted questions, small contributions'
  },
  {
    category: 'technical',
    question: 'Tell me about a time you improved the performance of a system.',
    ideal_answer:
      'STAR: Establish baseline metrics first. Profile to find actual bottleneck (not assumed). Implement targeted optimization. Measure improvement against baseline. Deploy and monitor. Document the approach for team knowledge.',
    evaluation_criteria: 'Measurement-first approach, profiling habit, targeted fix, quantified improvement'
  },
  {
    category: 'technical',
    question: 'How do you handle technical debt in a project?',
    ideal_answer:
      'Acknowledge it explicitly — make it visible with tracking (tech debt backlog). Assess severity and risk. Allocate regular capacity (e.g., 20% of sprint) for debt reduction. Prioritize debt that blocks new features or causes incidents. Avoid accumulating new debt by enforcing standards.',
    evaluation_criteria: 'Visibility, prioritization, regular cadence, prevention mindset'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to collaborate across different teams or departments.',
    ideal_answer:
      'STAR: Describe the cross-functional need, explain how you established relationships and communication norms, detail coordination mechanisms (shared docs, regular syncs, clear RACI), share successful joint outcome.',
    evaluation_criteria: 'Cross-functional awareness, communication, relationship building, shared outcome'
  },
  {
    category: 'behavioral',
    question: 'Describe a project you are most proud of.',
    ideal_answer:
      'STAR: Pick something with clear impact and personal contribution. Describe the challenge or ambition, your specific role and actions, the outcome with quantified impact if possible, and why it matters to you personally.',
    evaluation_criteria: 'Ownership, impact clarity, personal connection, quantified results'
  },
  {
    category: 'leadership',
    question: 'How have you handled a situation where you had to influence without authority?',
    ideal_answer:
      'STAR: Describe the situation where formal authority was absent. Explain how you built credibility (expertise, track record, relationships). Detail influence approach: understand others\' incentives, align your ask to their goals, use data, earn trust incrementally.',
    evaluation_criteria: 'Stakeholder alignment, credibility building, data use, patience'
  },
  {
    category: 'situational',
    question: 'How would you handle being assigned to a project you believe will fail?',
    ideal_answer:
      'First, validate the concern — gather data and understand the full picture, you may be missing context. Share concerns early and privately with the project owner or manager with specific, data-backed reasoning. Propose mitigations. If overruled, commit professionally and document concerns. Raise red flags actively during execution.',
    evaluation_criteria: 'Constructive dissent, data-backed concern, professional commitment, continued monitoring'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to manage stakeholder expectations.',
    ideal_answer:
      'STAR: Identify misaligned expectation early (scope, timeline, quality). Describe proactive communication — what you told them, when, how. Explain trade-offs presented. Share how alignment was reached and project delivered.',
    evaluation_criteria: 'Proactive communication, transparency, trade-off clarity, alignment outcome'
  },
  {
    category: 'technical',
    question: 'Describe a time you introduced a new tool or process to your team.',
    ideal_answer:
      'STAR: Identify the pain the tool addresses. Build buy-in with data and pilot. Roll out incrementally with training and documentation. Measure adoption and impact. Gather feedback and iterate.',
    evaluation_criteria: 'Problem-first thinking, change management, measurement, iteration'
  },
  {
    category: 'behavioral',
    question: 'Tell me about a time you had to say no to a request.',
    ideal_answer:
      'STAR: Explain the request and why saying no was right (capacity, priority, misalignment). Describe how you said no — clearly, respectfully, with reasoning and alternative if possible. Share outcome — how trust was maintained.',
    evaluation_criteria: 'Assertiveness, clear reasoning, alternatives offered, relationship preserved'
  },
  {
    category: 'behavioral',
    question: 'Tell me about yourself.',
    ideal_answer:
      'Structure: current role and key responsibility (1 sentence), relevant past experience with impact (1-2 sentences), key skills aligned to this role (1 sentence), why this role/company excites you (1 sentence). Keep to 90 seconds. End with a forward-looking statement.',
    evaluation_criteria: 'Concise, role-relevant, specific over generic, forward-looking, confident delivery'
  }
]

export const interviewQuestions: InterviewQuestion[] = rawQuestions.map((q) => ({
  ...q,
  packId: CATEGORY_TO_PACK[q.category],
}))

export const ragDocuments = interviewQuestions.map((q, i) => ({
  id: i + 1,
  text: `Category: ${q.category}\nQuestion: ${q.question}\nIdeal Answer: ${q.ideal_answer}\nEvaluation Criteria: ${q.evaluation_criteria}`,
  metadata: { category: q.category, packId: q.packId, question: q.question }
}))
