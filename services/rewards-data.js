const path = require('path');
const { readJsonFile, writeJsonFile } = require('./json-store');

const rewardsDataPath = path.join(__dirname, '..', 'data', 'rewards.json');

const defaultRewardsData = {
  settings: {
    budgetPercent: 3.5,
    revenueBaseline: 120000,
    odds: {
      instant: '1:5',
      common: '1:25',
      rare: '1:200',
      legendary: '1:1000',
    },
    updatedAt: '2024-01-10T12:00:00.000Z',
    updatedBy: 'system',
  },
  automation: {
    dynamicProbability: true,
    expiringPieces: true,
    flashEvents: true,
    skillChallenges: false,
    winSharing: true,
    rewardPoints: false,
    updatedAt: '2024-01-15T09:30:00.000Z',
    updatedBy: 'system',
  },
  summary: {
    players: 1840,
    activeStreaks: 312,
    instantWins: 128,
    completedSets: 56,
    activeCollections: 420,
    collectionPieces: 15400,
    totalPoints: 845000,
    prizeBudget: {
      baseline: 120000,
      percent: 3.5,
      pool: 4200,
    },
    latestWinners: [
      {
        id: 'player-1124',
        name: 'Tasha',
        prize: '$50 gift card',
        claimedAt: '2024-01-19T17:22:00.000Z',
        shareCard: 'Shared a BoGo code with their crew in West Philly.',
      },
      {
        id: 'player-1140',
        name: 'Liam',
        prize: 'Free family meal',
        claimedAt: '2024-01-19T12:08:00.000Z',
      },
      {
        id: 'player-1088',
        name: 'Alina',
        prize: '$25 loyalty top-up',
        claimedAt: '2024-01-18T21:45:00.000Z',
      },
    ],
    updatedAt: '2024-01-20T10:15:00.000Z',
  },
  winners: [
    {
      id: 'player-1124',
      name: 'Tasha',
      prize: '$50 gift card',
      claimedAt: '2024-01-19T17:22:00.000Z',
      shareCard: 'Shared a BoGo code with their crew in West Philly.',
    },
    {
      id: 'player-1140',
      name: 'Liam',
      prize: 'Free family meal',
      claimedAt: '2024-01-19T12:08:00.000Z',
    },
    {
      id: 'player-1088',
      name: 'Alina',
      prize: '$25 loyalty top-up',
      claimedAt: '2024-01-18T21:45:00.000Z',
    },
    {
      id: 'player-1099',
      name: 'Marcus',
      prize: 'Free wings for a month',
      claimedAt: '2024-01-18T09:12:00.000Z',
    },
  ],
  events: {
    flashEvents: [
      {
        id: 'flash-jan-firecracker',
        title: 'Firecracker Friday',
        startsAt: '2024-01-26T16:00:00.000Z',
        endsAt: '2024-01-27T01:00:00.000Z',
        multiplier: 2,
        description: 'Double the instant win odds for lunch combo orders.',
      },
      {
        id: 'flash-jan-latenight',
        title: 'Late-night noodle rush',
        startsAt: '2024-01-27T02:00:00.000Z',
        endsAt: '2024-01-27T05:00:00.000Z',
        multiplier: 3,
        description: 'Triple points on orders after midnight.',
      },
    ],
    expiringPieces: [
      {
        id: 'piece-golden-dragon',
        label: 'Golden dragon piece',
        expiresAt: '2024-01-31T05:00:00.000Z',
        reminder: 'Push reminder to VIP tier players on Jan 29th.',
      },
    ],
    streakBoosts: [
      {
        id: 'streak-hot-streak',
        requirement: 'Maintain a 5-day streak',
        reward: 'Unlocks a guaranteed rare piece',
        description: 'Keeps the collection streak hype alive before Lunar New Year.',
      },
      {
        id: 'streak-first-timers',
        requirement: 'Three orders in first week',
        reward: '1,000 bonus points',
      },
    ],
    marketingMoments: [
      {
        id: 'moment-lunar-prep',
        headline: 'Lunar New Year warm-up',
        callToAction: 'Encourage family bundle pre-orders.',
      },
      {
        id: 'moment-sixers',
        headline: 'Sixers playoff push',
        callToAction: 'Promote watch party platters with bonus pieces.',
      },
    ],
  },
};

function normalizeRewardsData(payload = {}) {
  const settings = {
    ...defaultRewardsData.settings,
    ...(payload.settings || {}),
    odds: {
      ...defaultRewardsData.settings.odds,
      ...(payload.settings?.odds || {}),
    },
  };

  const automation = {
    ...defaultRewardsData.automation,
    ...(payload.automation || {}),
  };

  const summary = {
    ...defaultRewardsData.summary,
    ...(payload.summary || {}),
    prizeBudget: {
      ...defaultRewardsData.summary.prizeBudget,
      ...(payload.summary?.prizeBudget || {}),
    },
    latestWinners: Array.isArray(payload.summary?.latestWinners)
      ? payload.summary.latestWinners
      : defaultRewardsData.summary.latestWinners,
  };

  const winners = Array.isArray(payload.winners) && payload.winners.length
    ? payload.winners
    : defaultRewardsData.winners;

  const events = {
    flashEvents: Array.isArray(payload.events?.flashEvents)
      ? payload.events.flashEvents
      : defaultRewardsData.events.flashEvents,
    expiringPieces: Array.isArray(payload.events?.expiringPieces)
      ? payload.events.expiringPieces
      : defaultRewardsData.events.expiringPieces,
    streakBoosts: Array.isArray(payload.events?.streakBoosts)
      ? payload.events.streakBoosts
      : defaultRewardsData.events.streakBoosts,
    marketingMoments: Array.isArray(payload.events?.marketingMoments)
      ? payload.events.marketingMoments
      : defaultRewardsData.events.marketingMoments,
  };

  return { settings, automation, summary, winners, events };
}

async function readRewardsData() {
  const data = await readJsonFile(rewardsDataPath, defaultRewardsData);
  return normalizeRewardsData(data);
}

async function writeRewardsData(payload) {
  await writeJsonFile(rewardsDataPath, payload);
  return payload;
}

function computeBudgetPool(settings) {
  const percent = Number(settings.budgetPercent);
  const baseline = Number(settings.revenueBaseline);
  if (!Number.isFinite(percent) || !Number.isFinite(baseline)) {
    return 0;
  }
  return (baseline * percent) / 100;
}

async function getRewardsOverview() {
  const data = await readRewardsData();
  return {
    settings: {
      ...data.settings,
      budgetPool: computeBudgetPool(data.settings),
    },
    automation: data.automation,
    summary: {
      ...data.summary,
      prizeBudget: {
        ...data.summary.prizeBudget,
        pool: computeBudgetPool({
          budgetPercent: data.summary.prizeBudget.percent,
          revenueBaseline: data.summary.prizeBudget.baseline,
        }),
      },
    },
    winners: data.winners,
    events: data.events,
  };
}

async function updateRewardsSettings(update = {}) {
  const data = await readRewardsData();
  const settings = { ...data.settings };

  if (Object.prototype.hasOwnProperty.call(update, 'budgetPercent')) {
    const percent = Number(update.budgetPercent);
    if (!Number.isFinite(percent) || percent <= 0) {
      throw new Error('Budget percent must be a positive number.');
    }
    settings.budgetPercent = percent;
  }

  if (Object.prototype.hasOwnProperty.call(update, 'revenueBaseline')) {
    const baseline = Number(update.revenueBaseline);
    if (!Number.isFinite(baseline) || baseline < 0) {
      throw new Error('Revenue baseline must be zero or greater.');
    }
    settings.revenueBaseline = baseline;
  }

  if (update.odds && typeof update.odds === 'object') {
    settings.odds = {
      ...settings.odds,
      ...update.odds,
    };
  }

  settings.updatedAt = new Date().toISOString();
  settings.updatedBy = typeof update.updatedBy === 'string' && update.updatedBy.trim() ? update.updatedBy.trim() : 'system';

  const budgetPool = computeBudgetPool(settings);

  const updatedData = {
    ...data,
    settings,
    summary: {
      ...data.summary,
      prizeBudget: {
        baseline: settings.revenueBaseline,
        percent: settings.budgetPercent,
        pool: budgetPool,
      },
    },
  };

  await writeRewardsData(updatedData);

  return {
    ...settings,
    budgetPool,
  };
}

async function updateRewardsAutomation(update = {}) {
  const data = await readRewardsData();
  const automation = { ...data.automation };
  const keys = [
    'dynamicProbability',
    'expiringPieces',
    'flashEvents',
    'skillChallenges',
    'winSharing',
    'rewardPoints',
  ];

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(update, key)) {
      automation[key] = Boolean(update[key]);
    }
  });

  automation.updatedAt = new Date().toISOString();
  automation.updatedBy =
    typeof update.updatedBy === 'string' && update.updatedBy.trim() ? update.updatedBy.trim() : 'system';

  const updatedData = {
    ...data,
    automation,
  };

  await writeRewardsData(updatedData);

  return automation;
}

module.exports = {
  getRewardsOverview,
  updateRewardsSettings,
  updateRewardsAutomation,
};
