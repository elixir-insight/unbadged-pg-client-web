import type { Component } from 'svelte';
import Briefcase from '@lucide/svelte/icons/briefcase';
import Users from '@lucide/svelte/icons/users';
import Handshake from '@lucide/svelte/icons/handshake';
import Coins from '@lucide/svelte/icons/coins';
import TrendingUp from '@lucide/svelte/icons/trending-up';
import Receipt from '@lucide/svelte/icons/receipt';
import Landmark from '@lucide/svelte/icons/landmark';
import Wallet from '@lucide/svelte/icons/wallet';
import Banknote from '@lucide/svelte/icons/banknote';
import Building2 from '@lucide/svelte/icons/building-2';
import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
import Shield from '@lucide/svelte/icons/shield';
import Zap from '@lucide/svelte/icons/zap';
import Clock from '@lucide/svelte/icons/clock';
import Smartphone from '@lucide/svelte/icons/smartphone';
import User from '@lucide/svelte/icons/user';
import CreditCard from '@lucide/svelte/icons/credit-card';
import Send from '@lucide/svelte/icons/send';
import FileText from '@lucide/svelte/icons/file-text';

const iconMap: Record<string, Component<{ class?: string }>> = {
	briefcase: Briefcase,
	users: Users,
	handshake: Handshake,
	coins: Coins,
	'trending-up': TrendingUp,
	receipt: Receipt,
	landmark: Landmark,
	wallet: Wallet,
	banknote: Banknote,
	'building-2': Building2,
	'rotate-ccw': RotateCcw,
	shield: Shield,
	zap: Zap,
	clock: Clock,
	smartphone: Smartphone,
	user: User,
	'credit-card': CreditCard,
	send: Send,
	'file-text': FileText
};

export function getFeatureIcon(name: string): Component<{ class?: string }> {
	return iconMap[name] ?? Wallet;
}
