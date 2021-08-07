import { matches } from 'ip-matching';

// matches(ip: string | IP, target: string | IPMatch): boolean;

matches('10.0.0.1', '10.0.0.0/24'); // true

// Verifies webhook authenticity
// See: https://core.telegram.org/bots/webhooks#the-short-version
export const isTelegramSubnet = (ip: string) => matches(ip, '149.154.160.0/20') || matches(ip, '91.108.4.0/22')