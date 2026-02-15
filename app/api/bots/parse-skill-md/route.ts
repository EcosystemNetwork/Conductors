import { NextRequest, NextResponse } from 'next/server';

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
    const DEFAULT_JOB_PRICE = 10;

    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const h1Match = normalized.match(/^#\s+(.+)$/m);
    if (h1Match) {
        config.name = cleanValue(h1Match[1]);
    }

    const fieldPattern = (field: string) =>
        new RegExp(`^[-*]?\\s*\\*{0,2}${field}\\*{0,2}\\s*[:]+\\s*\\*{0,2}\\s*(.+)$`, 'mi');

    const nameField = normalized.match(fieldPattern('name'));
    if (nameField) {
        config.name = cleanValue(nameField[1]);
    }

    const skillsField = normalized.match(fieldPattern('skills'));
    if (skillsField) {
        config.skills = cleanValue(skillsField[1]).split(',').map(s => s.trim()).filter(Boolean);
    }

    const skillsSectionMatch = normalized.match(/^##\s+Skills\s*\n((?:[-*]\s+.+\n?)+)/mi);
    if (skillsSectionMatch && !config.skills) {
        config.skills = skillsSectionMatch[1]
            .split('\n')
            .map(line => cleanValue(line.replace(/^[-*]\s+/, '')))
            .filter(Boolean);
    }

    const walletField = normalized.match(fieldPattern('wallet(?:\\s*address)?'));
    if (walletField) {
        config.walletAddress = cleanValue(walletField[1]);
    }

    const costField = normalized.match(/^[-*]?\s*\*{0,2}cost(?:\s*per\s*task)?\*{0,2}\s*[:]+\s*\*{0,2}\s*\$?(\d+(?:\.\d+)?)/mi);
    if (costField) {
        config.costPerTask = parseFloat(costField[1]);
    }

    const descField = normalized.match(fieldPattern('description'));
    if (descField) {
        config.description = cleanValue(descField[1]);
    }

    const jobOfferingsSection = normalized.match(/^##\s+Job\s+Offerings?\s*\n([\s\S]*?)(?=\n##\s|\n#\s)/mi)
        || normalized.match(/^##\s+Job\s+Offerings?\s*\n([\s\S]*)/mi);
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
                price: offeringPrice ? parseFloat(offeringPrice[1]) : config.costPerTask || DEFAULT_JOB_PRICE,
                skills: offeringSkills
                    ? cleanValue(offeringSkills[1]).split(',').map(s => s.trim()).filter(Boolean)
                    : config.skills || [],
            });
        }

        if (offerings.length > 0) {
            config.jobOfferings = offerings;
        }
    }

    const capabilitiesSection = normalized.match(/^##\s+Capabilities\s*\n([\s\S]*?)(?=\n##\s|\n#\s)/mi)
        || normalized.match(/^##\s+Capabilities\s*\n([\s\S]*)/mi);
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

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
        return NextResponse.json(
            { error: 'Invalid input. Required: content (string) — the raw markdown content of a skill.md file' },
            { status: 400 }
        );
    }

    const parsed = parseSkillMd(content);

    if (!parsed.name && !parsed.skills) {
        return NextResponse.json(
            { error: 'Could not parse any bot configuration from the provided content. Ensure the file includes at least a name (# heading) or skills field.' },
            { status: 400 }
        );
    }

    return NextResponse.json({ success: true, config: parsed });
}
