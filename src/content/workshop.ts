export type SessionId = 1 | 2 | 3;

export interface SessionContent {
  id: SessionId;
  title: string;
  subtitle: string;
  coreQuestion: string;
  narrative: string[];
  scenario: string;
  exerciseTitle: string;
  exerciseDescription: string;
}

export const intro = {
  headline: "The Harmony of Relationships",
  subheadline:
    "A framework for relational balance, a way of seeing how you distribute yourself across every relationship in your life: work, close relationships, family, friends, hobbies, community, and yourself.",
  description: [
    "Most people experience their relationships as something that happens to them rather than something they actively shape. Work asks for more hours. Family calls more often. A friendship fades because no one has enough space for it. A partner, a roommate, a community group—each one pulls. Life fills up, and somewhere in that filling, the person at the center of all these relationships, the self, gets crowded out.",
    "This framework proposes a different way of seeing. It begins with a simple but radical premise: the distribution of your time and energy across the relationships in your life is, in almost every case, a choice. Not always conscious. Not always free. But a choice nonetheless. When that choice becomes conscious, when you can see it clearly and name it honestly, you gain the ability to move toward a life that actually reflects your values, your needs, and your vision of who you want to be.",
    "The central concept is relational balance, described visually through a Venn diagram. Every relationship is a circle: work, close relationships, family, friends, hobbies, community, and the self. The goal is not balance in the arithmetic sense, equal time for everyone, but harmony: an ongoing negotiation that distributes you across these relationships in a way that honors each of them and still leaves space for you. Harmony is not a destination. It is a practice.",
    "That negotiation has never been more difficult, or more urgent. In 2023 the U.S. Surgeon General declared loneliness and isolation an epidemic. The WHO launched a Commission on Social Connection the same year, framing relational disconnection as a threat to health on par with obesity or tobacco. This work treats that moment not as background context, but as the reason it matters.",
  ],
};

export const sessions: SessionContent[] = [
  {
    id: 1,
    title: "See It",
    subtitle: "Draw your Current and your Ideal",
    coreQuestion: "What does your life actually look like right now, and what do you want it to look like?",
    narrative: [
      "You are the circle in the middle. Around you are the relationships that pull on your time and energy: work, a partner, family, friends, a community, a hobby, yourself. Where another circle overlaps yours is the space that relationship takes.",
      "Most people have never seen their life laid out this way. Session one is one thing only: draw your Current, then draw your Ideal. The gap between the two is the whole workshop.",
    ],
    scenario:
      "Draw two diagrams. Your Current, exactly as life is right now. Your Ideal, the shape you actually want. Do not edit as you go. Just draw both.",
    exerciseTitle: "Draw Your Diagram",
    exerciseDescription:
      "Place yourself in the center. Add a circle for each relationship. Shape your Current, then your Ideal. Sit with the difference.",
  },
  {
    id: 2,
    title: "Name It",
    subtitle: "Where the gap comes from",
    coreQuestion: "Which circle grew without you choosing it, and what would you need to say to change that?",
    narrative: [
      "Circles rarely expand by decision. Work grows one reasonable ask at a time. Family expands around a crisis. A friendship thins because no one asked it to stay. By the time you notice, the diagram looks like something that happened to you.",
      "Session two is about naming the one circle in your Current that is out of proportion, and the specific conversation, boundary, or agreement that would let it shift.",
    ],
    scenario:
      "Look at your Current. Pick the one circle that is bigger, or smaller, than you would choose. Who would you need to talk to, and what would you need to say, for that circle to move?",
    exerciseTitle: "Name the One Circle",
    exerciseDescription:
      "Choose one circle to resize. Write the name of the person on the other side of that circle, and one sentence you would say to them.",
  },
  {
    id: 3,
    title: "Commit to It",
    subtitle: "One shift, this month",
    coreQuestion: "What is the smallest change that would move your Current one step toward your Ideal?",
    narrative: [
      "Harmony is not a redesign of your life. It is one honest adjustment, held long enough to matter, then another.",
      "Session three ends with a single commitment. Not a plan. Not a list. One specific thing you will do this month that moves the circle you named in session two.",
    ],
    scenario:
      "Return to the circle you named in session two. What is the smallest action you can take in the next thirty days that would begin to resize it?",
    exerciseTitle: "Your Commitment",
    exerciseDescription:
      "Write one sentence: what you will do, with whom, by when. Small enough to actually happen. Clear enough that you will know when it is done.",
  },

];

export const tracks = [
  {
    id: "A",
    title: "Track A, Work & Professional Life",
    question:
      "Have you made a conscious choice about how much space work gets, or has it simply taken the space it wanted?",
    body: "This track is for people who sense their work circle has expanded beyond what they chose. It does not prescribe how much time work should take. Inside the work circle there are smaller relationships worth naming: the people you work with, the roles you carry, and the work itself. Each can be renegotiated separately. Consider also the social dimensions of work, collegial relationships, ambient contact, which occupy their own space in the diagram. Hybrid and remote arrangements rearrange that space, sometimes invisibly. Decide for yourself what distribution you want, and then examine what adjustments, conversations, or commitments would be required to move toward it.",
  },
  {
    id: "B",
    title: "Track B, Close Relationships",
    question:
      "Do you and the people closest to you share an understanding of what the diagram should look like, and have you ever talked about it explicitly?",
    body: "This track applies to any close relationship: a partner, a roommate, a chosen family member, a closest friend. Most people have never had this conversation in any of their close relationships. Implicit assumptions about how much overlap is appropriate calcify into expectations that neither person has examined. The complexity grows as life changes, sharing a home, integrating networks, the arrival of new responsibilities or people that temporarily compress almost everything else. That is not a failure of balance; it is a chosen disbalance. What matters is that the choice is made consciously, communicated clearly, and revisited as life changes. Draw your diagrams side by side. The conversation that follows is not about who is right, it is about understanding where the diagrams differ and why.",
  },
  {
    id: "C",
    title: "Track C, Family & Community",
    question: "Where do your family's expectations end and your own choices begin?",
    body: "Family and community relationships are saturated with obligation, history, and unspoken expectation. They often expand without a conversation having taken place: a parent's needs increase, a sibling enters a crisis, a community role you took on temporarily becomes permanent. In the absence of a conscious renegotiation, these shifts harden. This track helps you map the difference between what you give to family and community by genuine choice and what you give out of duty, guilt, or fear of consequences.",
  },
];

export const facilitatorAgenda = [
  {
    session: 1,
    title: "The Diagram",
    blocks: [
      { time: "0, 10 min", label: "Welcome & framing" },
      { time: "10, 25 min", label: "Introduce the Venn metaphor on shared surface" },
      { time: "25, 40 min", label: "Walk through scenario, open discussion" },
      { time: "40, 60 min", label: "Reflection: participants draw Current + Ideal" },
      { time: "60, 75 min", label: "Group share: the gap between the two diagrams" },
    ],
  },
  {
    session: 2,
    title: "Diving Deeper",
    blocks: [
      { time: "0, 15 min", label: "Recap; introduce complexity of each circle" },
      { time: "15, 35 min", label: "Work, close relationships, family, friends, hobbies, narrative" },
      { time: "35, 50 min", label: "Scenario: every circle pulling at once" },
      { time: "50, 75 min", label: "Harmony Audit (3 questions per circle)" },
    ],
  },
  {
    session: 3,
    title: "Targeted Application",
    blocks: [
      { time: "0, 10 min", label: "Recap; choose the track that fits the room" },
      { time: "10, 35 min", label: "Track narrative + scenario" },
      { time: "35, 55 min", label: "Private reflection on one commitment" },
      { time: "55, 75 min", label: "Closing share: harmony is a practice, not a destination" },
    ],
  },
];

export const references = [
  "Urie Bronfenbrenner, The Ecology of Human Development (1979)",
  "Edward Deci and Richard Ryan, A Motivational Approach to Self (1991)",
  "Roy Baumeister and Mark Leary, The Need to Belong, Psychological Bulletin (1995)",
  "Kristin Neff, Self-Compassion: The Proven Power of Being Kind to Yourself (2011)",
  "John Gottman, The Seven Principles for Making Marriage Work (1999)",
  "Esther Perel, Mating in Captivity (2006)",
  "Arlie Hochschild, The Time Bind (1997)",
  "Robert Putnam, Bowling Alone (2000)",
  "Mihaly Csikszentmihalyi, Flow: The Psychology of Optimal Experience (1990)",
  "Robert Waldinger and Marc Schultz, The Good Life (2023)",
  "Julianne Holt-Lunstad, Social Connection as a Critical Factor for Mental and Physical Health, World Psychiatry (2024)",
  "U.S. Surgeon General Vivek Murthy, Our Epidemic of Loneliness and Isolation (2023)",
  "WHO Commission on Social Connection, From Loneliness to Social Connection (2025)",
  "Brumley, Montazer, et al., Remote Work and Work-Family Conflict During COVID-19, Sociological Perspectives (2024)",
  "Household Pulse Survey Analysis, Remote Work and Loneliness among Employed U.S. Adults, ScienceDirect (2024)",
];

export const framework = {
  title: "The Conceptual Framework",
  subtitle: "The Harmony of Relationships: A Framework for Relational Balance",
  sections: [
    {
      heading: "Overview",
      paragraphs: [
        "Most people experience their relationships as something that happens to them. Work asks for more. Family calls more often. A friendship fades. Life fills up, and the self at the center gets crowded out.",
        "This framework starts from a simple premise: how you spread your time and energy across the relationships in your life is, almost always, a choice. When that choice becomes conscious, you can begin to shape a life that reflects what you actually want.",
      ],
    },
    {
      heading: "The Relational Venn Diagram",
      paragraphs: [
        "Picture a circle. That circle is you. Around it are other circles: work, close relationships, family, friends, hobbies, and community. Where your circle overlaps another, that overlap is the time and energy you give that relationship.",
        "The space inside your circle that touches no one else is time with yourself. It is not empty, it is yours. When it disappears, the relationship that underpins every other one starts to thin.",
        "The goal is not equal time for everyone. It is harmony: different voices, different weights, all in service of something coherent and alive. Harmony is a practice, not a destination.",
      ],
    },
    {
      heading: "What the research says",
      paragraphs: [
        "The framework draws on decades of research into how relationships shape wellbeing. Work by Bronfenbrenner, Deci and Ryan, Baumeister and Leary, and Kristin Neff points to the same idea from different angles: we need meaningful bonds with others, and we need a stable relationship with ourselves for those bonds to hold.",
        "More recent work adds urgency. The Harvard Study of Adult Development found that the quality of close relationships in midlife predicts health and happiness at eighty better than cholesterol does. In 2023 the U.S. Surgeon General called loneliness an epidemic, and the WHO launched a Commission on Social Connection the same year.",
      ],
    },
    {
      heading: "Work",
      paragraphs: [
        "Work is the most accepted reason for a circle to quietly expand, and often the hardest one to see growing. Instead of work-life balance, the framework asks for harmony: work takes the space it genuinely needs, in conscious negotiation with the rest of the diagram.",
        "Work is also not a single circle. The work itself can include different relationships and responsibilities that pull in their own way. Naming them separately is usually the first step toward changing them.",
      ],
    },
    {
      heading: "Close relationships",
      paragraphs: [
        "In close relationships, of any kind, two circles move toward each other. Over time new questions come up: how much overlap is right for us now, and what does each of us need in the space that stays our own? Most people never have this conversation out loud.",
        "Gottman's work on updating your picture of the other person, and Perel's work on desire and distance, both point the same direction: closeness lasts when the self each person brings to it stays intact.",
      ],
    },
    {
      heading: "Family, friends, and hobbies",
      paragraphs: [
        "Family relationships carry history and unspoken expectation. They often expand without anyone deciding they should. Friends and hobbies, which carry the least obligation, are usually the first circles to shrink when others grow.",
        "Putnam's Bowling Alone traced the long decline of these circles. Csikszentmihalyi showed that hobbies produce a kind of aliveness nothing else replaces. These are not small losses when they go.",
      ],
    },
    {
      heading: "The practice of harmony",
      paragraphs: [
        "The Venn diagram is a simple tool. What it makes visible is not: the shape of a whole life, held up as a question. Is this the distribution you would choose if you were choosing freely?",
        "Harmony is a practice you return to, a conversation you keep having with yourself and with the people you love. The diagram is where that conversation begins.",
      ],
    },
  ],
};

