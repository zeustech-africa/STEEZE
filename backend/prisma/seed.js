const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const prohibitedWords = [
  // Politics
  'politic', 'election', 'vote', 'president', 'government', 'minister', 'parliament',
  'democracy', 'republican', 'democrat', 'party', 'campaign', 'senate', 'congress',
  'white house', 'capitol', 'biden', 'trump', 'putin', 'zelensky', 'netanyahu',
  'israel', 'palestine', 'gaza', 'war', 'terrorist', 'bomb', 'missile', 'weapon',
  
  // Violence & Gore
  'kill', 'murder', 'death', 'die', 'blood', 'gore', 'violence', 'attack', 'assault',
  'shoot', 'gun', 'knife', 'stab', 'strangle', 'suicide', 'hang', 'explosion',
  'rape', 'abuse', 'torture', 'burn', 'punch', 'fight', 'beating', 'slit throat',
  
  // Hate Speech
  'hate', 'racist', 'racism', 'nazi', 'kkk', 'white power', 'black power',
  'faggot', 'queer', 'tranny', 'retard', 'cunt', 'whore', 'slut', 'bitch',
  'bastard', 'dickhead', 'asshole', 'motherfucker', 'shit', 'fuck',
  
  // News & Sad Stories
  'news', 'breaking news', 'headline', 'journalist', 'reporter',
  'died', 'death', 'funeral', 'tragedy', 'accident', 'victim', 'suffering',
  'cancer', 'disease', 'sick', 'illness', 'poverty', 'homeless', 'starving',
  'flood', 'earthquake', 'fire', 'disaster', 'emergency', 'ambulance',
  
  // Religion
  'allah', 'quran', 'bible', 'jesus', 'muhammad', 'mosque', 'church', 'temple',
  'prayer', 'worship', 'prophet', 'god', 'religion', 'islam', 'christian', 'jewish',
  'hindu', 'buddhist', 'catholic', 'protestant',
  
  // Scams & Spam
  'bitcoin', 'crypto', 'ethereum', 'nft', 'investment', 'earn money', 'get rich',
  'millionaire', 'billionaire', 'lottery', 'winner', 'click here', 'link in bio',
];

async function main() {
  console.log('Seeding content scan rules...');
  
  for (const word of prohibitedWords) {
    await prisma.contentScanRule.upsert({
      where: { id: 0 },
      update: {},
      create: {
        type: 'word_blacklist',
        value: word.toLowerCase(),
        severity: 'reject',
      },
    });
  }
  
  console.log(`Added ${prohibitedWords.length} prohibited words.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
