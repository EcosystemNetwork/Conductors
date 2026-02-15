import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to parse a skill.md file and extract bot configuration
 * POST /api/bots/parse-skill-md
 *
 * Body:
 * {
 *   content: string  // Raw markdown content of the skill.md file
 * }
 *
 * Returns parsed bot configuration:
 * {
 *   name?: string,
 *   skills?: string[],
 *   walletAddress?: string,
 *   costPerTask?: number,
 *   description?: string,
 *   jobOfferings?: Array<{ name: string, description: string, price: number, skills: string[] }>,
 *   capabilities?: { maxConcurrentTasks?: number, supportedPaymentMethods?: string[], description?: string }
 * }
 */

interface ParsedSkillConfig {
  name?: string;
  skills?: string[];
  walletAddress?: string;
  costPerTask?: number;
  description?: string;
  jobOfferings?: Array<{
    name: string;
    description: string;
    price: number;
    skills: string[];
  }>;
  capabilities?: {
    maxConcurrentTasks?: number;
    supportedPaymentMethods?: string[];
    description?: string;
  };
}

function cleanValue(val: string): string {
  return val.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

function parseSkillMd(content: string): ParsedSkillConfig {
  const config: ParsedSkillConfig = {};

  // Extract name from first H1 heading or "name:" field
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    config.name = cleanValue(h1Match[1]);
  }

  // Extract fields from key: value patterns (case-insensitive)
  // Handles formats like: - **Name:** value, Name: value, * **Name:** value, **Name**: value
  const fieldPattern = (field: string) =>
    new RegExp(`^[-*]?\\s*\\*{0,2}${field}\\*{0,2}\\s*[:]+\\s*\\*{0,2}\\s*(.+)$`, 'mi');

  const nameField = content.match(fieldPattern('name'));
  if (nameField) {
    config.name = cleanValue(nameField[1]);
  }

  const skillsField = content.match(fieldPattern('skills'));
  if (skillsField) {
    config.skills = cleanValue(skillsField[1]).split(',').map(s => s.trim()).filter(Boolean);
  }

  // Also look for skills as a bullet list under a "## Skills" heading
  const skillsSectionMatch = content.match(/^##\s+Skills\s*\n((?:[-*]\s+.+\n?)+)/mi);
  if (skillsSectionMatch && !config.skills) {
    config.skills = skillsSectionMatch[1]
      .split('\n')
      .map(line => cleanValue(line.replace(/^[-*]\s+/, '')))
      .filter(Boolean);
  }

  const walletField = content.match(fieldPattern('wallet(?:\\s*address)?'));
  if (walletField) {
    config.walletAddress = cleanValue(walletField[1]);
  }

  const costField = content.match(/^[-*]?\s*\*{0,2}cost(?:\s*per\s*task)?\*{0,2}\s*[:]+\s*\*{0,2}\s*\$?(\d+(?:\.\d+)?)/mi);
  if (costField) {
    config.costPerTask = parseFloat(costField[1]);
  }

  const descField = content.match(fieldPattern('description'));
  if (descField) {
    config.description = cleanValue(descField[1]);
  }

  // Parse job offerings section
  const jobOfferingsSection = content.match(/^##\s+Job\s+Offerings?\s*\n([\s\S]*?)(?=\n##\s|\n#\s)/mi)
    || content.match(/^##\s+Job\s+Offerings?\s*\n([\s\S]*)/mi);
  if (jobOfferingsSection) {
    const offerings: ParsedSkillConfig['jobOfferings'] = [];
    const offeringBlocks = jobOfferingsSection[1].split(/^###\s+/m).filter(Boolean);

    for (const block of offeringBlocks) {
      const blockLines = block.split('\n');
      const offeringName = cleanValue(blockLines[0] || '');
      if (!offeringName) continue;

      const offeringDesc = block.match(fieldPattern('description'));
      const offeringPrice = block.match(/^[-*]?\s*\*{0,2}price\*{0,2}\s*[:]+\s*\*{0,2}\s*\$?(\d+(?:\.\d+)?)/mi);
      const offeringSkills = block.match(fieldPattern('skills'));

      offerings.push({
        name: offeringName,
        description: offeringDesc ? cleanValue(offeringDesc[1]) : offeringName,
        price: offeringPrice ? parseFloat(offeringPrice[1]) : config.costPerTask || 10,
        skills: offeringSkills
          ? cleanValue(offeringSkills[1]).split(',').map(s => s.trim()).filter(Boolean)
          : config.skills || [],
      });
    }

    if (offerings.length > 0) {
      config.jobOfferings = offerings;
    }
  }

  // Parse capabilities section
  const capabilitiesSection = content.match(/^##\s+Capabilities\s*\n([\s\S]*?)(?=\n##\s|\n#\s)/mi)
    || content.match(/^##\s+Capabilities\s*\n([\s\S]*)/mi);
  if (capabilitiesSection) {
    const capText = capabilitiesSection[1];
    const capabilities: ParsedSkillConfig['capabilities'] = {};

    const maxConcurrent = capText.match(/^[-*]?\s*\*{0,2}max\s*concurrent\s*tasks?\*{0,2}\s*[:]+\s*\*{0,2}\s*(\d+)/mi);
    if (maxConcurrent) {
      capabilities.maxConcurrentTasks = parseInt(maxConcurrent[1]);
    }

    const paymentMethods = capText.match(/^[-*]?\s*\*{0,2}(?:supported\s*)?payment\s*methods?\*{0,2}\s*[:]+\s*\*{0,2}\s*(.+)$/mi);
    if (paymentMethods) {
      capabilities.supportedPaymentMethods = cleanValue(paymentMethods[1])
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    const capDesc = capText.match(/^[-*]?\s*\*{0,2}description\*{0,2}\s*[:]+\s*\*{0,2}\s*(.+)$/mi);
    if (capDesc) {
      capabilities.description = cleanValue(capDesc[1]);
    }

    if (Object.keys(capabilities).length > 0) {
      config.capabilities = capabilities;
    }
  }

  return config;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({
      error: 'Invalid input. Required: content (string) — the raw markdown content of a skill.md file',
    });
  }

  const parsed = parseSkillMd(content);

  if (!parsed.name && !parsed.skills) {
    return res.status(400).json({
      error: 'Could not parse any bot configuration from the provided content. Ensure the file includes at least a name (# heading) or skills field.',
    });
  }

  return res.status(200).json({
    success: true,
    config: parsed,
  });
}
