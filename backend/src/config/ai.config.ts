function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY environment variable is required');
  return key;
}

const aiConfig = {
  openai: {
    get apiKey() { return getOpenAIKey(); },
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
  },
  obf: {
    baseUrl: 'https://world.openbeautyfacts.org',
  },
  youCam: {
    apiKey: process.env.YOUCAM_API_KEY || '',
    apiUrl: process.env.YOUCAM_API_URL || 'https://yce-api-01.makeupar.com/s2s/v2.1/task/skin-analysis',
    useMock: process.env.YOUCAM_USE_MOCK !== 'false',
  },
};

export default aiConfig;
