"use client";

import Image from "next/image";
import type React from "react";
import { useRef, useState, useCallback } from "react";
import Tilt from "react-parallax-tilt";
import { cn } from "@/lib/utils";
import "./holo-card.css";

// ============================================================================
// Types
// ============================================================================

export interface HoloCardDisplayData {
	/** Primary name displayed on the card */
	name: string;
	/** Secondary text (e.g., personality phrase, tagline) */
	subtitle?: string;
	/** Extended description shown on the back of the card */
	description?: string;
	/** Primary identifier (e.g., user number, ID) */
	primaryId?: string | number;
	/** Secondary info (e.g., member since date) */
	secondaryInfo?: string;
	/** Background image URL */
	backgroundImage?: string;
	/** Badge/tag text (e.g., house name, role) */
	badge?: string;
	/** Overlay color for the card */
	overlayColor?: string;
	/** Overlay opacity (0-100) */
	overlayOpacity?: number;
	/** Optional CTA link on the back of the card */
	actionHref?: string;
	/** Optional CTA label on the back of the card */
	actionLabel?: string;
}

export interface HoloCardBranding {
	/** Primary logo image URL */
	logo?: string;
	/** Logo alt text */
	logoAlt?: string;
	/** Icon shown in various places */
	icon?: string;
	/** Icon alt text */
	iconAlt?: string;
}

export interface HoloCardProps {
	/** Card display data */
	data: HoloCardDisplayData;
	/** Card dimensions */
	height?: number;
	width?: number;
	/** Show sparkle animation effect */
	showSparkles?: boolean;
	/** Force card to show front or back (disables flip) */
	forceSide?: "front" | "back";
	/** Custom branding (logos, icons) */
	branding?: HoloCardBranding;
	/** Additional CSS classes */
	className?: string;
	/** Children rendered inside the card */
	children?: React.ReactNode;
	/** Custom front content override */
	renderFront?: (data: HoloCardDisplayData) => React.ReactNode;
	/** Custom back content override */
	renderBack?: (data: HoloCardDisplayData) => React.ReactNode;
	/** Callback when card is flipped */
	onFlip?: (isFlipped: boolean) => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_BACKGROUND =
	"/images/features/Pusat-Kendali.png";

const DEFAULT_BRANDING: HoloCardBranding = {
	logo: "/images/logo.png",
	logoAlt: "Tirtawening",
	icon: "/images/favicon.svg",
	iconAlt: "Tirtawening",
};

// ============================================================================
// Component
// ============================================================================

export const HoloCard = ({
	data,
	height = 446,
	width = 320,
	showSparkles = true,
	forceSide,
	branding = DEFAULT_BRANDING,
	className,
	children,
	renderFront,
	renderBack,
	onFlip,
}: HoloCardProps) => {
	const [hover, setHover] = useState(false);
	const [animated, setAnimated] = useState(true);
	const [isFlipped, setIsFlipped] = useState(false);
	const [activeBackgroundPosition, setActiveBackgroundPosition] = useState({
		tp: 0,
		lp: 0,
	});
	const ref = useRef<HTMLDivElement>(null);

	const {
		name,
		subtitle,
		description,
		primaryId,
		secondaryInfo,
		backgroundImage = DEFAULT_BACKGROUND,
		badge,
		overlayColor,
		overlayOpacity = 40,
	} = data;

	const handleCardClick = useCallback(() => {
		if (!forceSide) {
			const newFlippedState = !isFlipped;
			setIsFlipped(newFlippedState);
			onFlip?.(newFlippedState);
		}
	}, [forceSide, isFlipped, onFlip]);

	const handleOnMouseMove = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			setAnimated(false);
			setHover(true);

			const card = ref.current;
			const l = event.nativeEvent.offsetX;
			const t = event.nativeEvent.offsetY;

			const h = card ? card.clientHeight : 0;
			const w = card ? card.clientWidth : 0;

			const px = Math.abs(Math.floor((100 / w) * l) - 100);
			const py = Math.abs(Math.floor((100 / h) * t) - 100);

			const lp = 50 + (px - 50) / 1.5;
			const tp = 50 + (py - 50) / 1.5;

			setActiveBackgroundPosition({ lp, tp });
		},
		[],
	);

	const handleOnTouchMove = useCallback(
		(event: React.TouchEvent<HTMLDivElement>) => {
			setAnimated(false);
			setHover(true);

			const card = ref.current;
			if (!card) return;

			const touch = event.touches[0];
			const rect = card.getBoundingClientRect();
			const l = touch.clientX - rect.left;
			const t = touch.clientY - rect.top;

			const h = card.clientHeight;
			const w = card.clientWidth;

			const px = Math.abs(Math.floor((100 / w) * l) - 100);
			const py = Math.abs(Math.floor((100 / h) * t) - 100);

			const lp = 50 + (px - 50) / 1.5;
			const tp = 50 + (py - 50) / 1.5;

			setActiveBackgroundPosition({ lp, tp });
		},
		[],
	);

	const handleOnMouseOut = useCallback(() => {
		setHover(false);
		setAnimated(true);
	}, []);

	const effectiveFlipped = forceSide ? forceSide === "back" : isFlipped;

	// Static mode styles for download/static rendering
	const containerStyle = forceSide
		? {
				perspective: "none",
				transform: "none",
			}
		: {
				perspective: "1000px",
				cursor: "pointer",
			};

	const innerStyle = forceSide
		? {
				transform: "none",
				position: "relative" as const,
				height: `${height}px`,
				width: `${width}px`,
			}
		: {
				transformStyle: "preserve-3d" as const,
				transform: effectiveFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
				height: `${height}px`,
				width: `${width}px`,
			};

	const frontStyle = forceSide
		? {
				display: forceSide === "front" ? "block" : "none",
				position: "absolute" as const,
				inset: 0,
			}
		: {
				position: "absolute" as const,
				inset: 0,
				backfaceVisibility: "hidden" as const,
				WebkitBackfaceVisibility: "hidden" as const,
			};

	const backStyle = forceSide
		? {
				display: forceSide === "back" ? "block" : "none",
				position: "absolute" as const,
				inset: 0,
				transform: "none",
			}
		: {
				position: "absolute" as const,
				inset: 0,
				backfaceVisibility: "hidden" as const,
				WebkitBackfaceVisibility: "hidden" as const,
				transform: "rotateY(180deg)",
			};

	const holoCardClasses = cn(
		"holo-card",
		hover && "holo-card--active",
		animated && "holo-card--animated",
		showSparkles && "holo-card--sparkles",
	);

	const holoCardStyle = {
		"--holo-width": `${width}px`,
		"--holo-height": `${height}px`,
		backgroundImage: `url(${backgroundImage})`,
		backgroundPosition: hover
			? `${activeBackgroundPosition.lp}% ${activeBackgroundPosition.tp}%`
			: "center",
	} as React.CSSProperties;

	// Overlay component
	const OverlayLayer = overlayColor ? (
		<div
			className="pointer-events-none absolute inset-0 z-[3]"
			style={{
				background: overlayColor,
				mixBlendMode: "overlay",
				opacity: overlayOpacity / 100,
			}}
		/>
	) : null;

	// Front card content
	const FrontContent = (
		<div className="pointer-events-none absolute z-[2] flex h-full w-full flex-col items-start justify-end p-3 text-white transition">
			{/* Top bar with logo and badge */}
			<div className="absolute top-4 left-0 flex w-full justify-between px-3">
				{branding.logo && (
					<div className="rounded-full bg-white/30 p-1 px-2 font-serif text-xl font-light text-white/70 backdrop-blur-md">
						<Image
							src={branding.logo}
							alt={branding.logoAlt || "Logo"}
							width={100}
							height={30}
							className="object-contain"
						/>
					</div>
				)}
				{badge && (
					<div className="rounded-full bg-white/20 p-1 px-4 font-serif text-xl font-light text-white/70 backdrop-blur-md">
						{badge}
					</div>
				)}
			</div>

			{/* Background icon */}
			{branding.icon && (
				<Image
					src={branding.icon}
					alt={branding.iconAlt || "Icon"}
					className="scale-125 opacity-10"
					fill
				/>
			)}

			{/* Bottom info card */}
			<div className="relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl bg-black/35 p-3.5 backdrop-blur-md border border-white/10">
				<div className="font-sans text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">{name}</div>
				{subtitle && (
					<div className="mb-4 font-normal text-xs text-white/85">{subtitle}</div>
				)}

				<div className="flex w-full items-center justify-between pt-1">
					<div className="flex flex-col items-start gap-0.5">
						{primaryId && (
							<span className="text-xs font-semibold text-white/90">{primaryId}</span>
						)}
						{secondaryInfo && (
							<span className="text-[11px] text-white/70 font-mono">{secondaryInfo}</span>
						)}
					</div>

					{branding.icon && (
						<div className="flex gap-2">
							<Image
								src={branding.icon}
								alt={branding.iconAlt || "Icon"}
								width={26}
								height={26}
								className="object-contain"
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	// Back card content
	const BackContent = (
		<div className="pointer-events-none absolute z-[2] flex h-full w-full flex-col items-start justify-between p-3.5 text-white">
			<div className="flex w-full flex-col gap-3">
				{/* Top bar */}
				<div className="flex items-center justify-between">
					{branding.logo && (
						<div className="rounded-full bg-white/30 p-1 px-2.5 backdrop-blur-md">
							<Image
								src={branding.logo}
								alt={branding.logoAlt || "Logo"}
								width={70}
								height={22}
								className="object-contain"
							/>
						</div>
					)}
					{badge && (
						<div className="rounded-full bg-white/20 p-1 px-3 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
							{badge}
						</div>
					)}
				</div>

				{/* Bio / Description section */}
				<div className="relative overflow-hidden rounded-2xl bg-black/35 p-4 backdrop-blur-md border border-white/10 space-y-2">
					<div className="font-sans text-lg font-bold text-white">
						{name}
					</div>
					{subtitle && (
						<div className="text-xs text-cyan-300 font-medium">
							{subtitle}
						</div>
					)}
					{description && (
						<p className="text-xs text-white/85 leading-relaxed">{description}</p>
					)}
				</div>
			</div>

			{/* Bottom info & Action Button */}
			<div className="w-full space-y-2">
				<div className="flex w-full items-center justify-between rounded-xl bg-black/35 p-3 backdrop-blur-md border border-white/10">
					<div className="flex flex-col gap-0.5">
						<span className="text-[10px] uppercase font-mono tracking-wider text-white/60">Info Layanan</span>
						<span className="text-xs font-semibold text-white">
							{secondaryInfo || "—"}
						</span>
					</div>
					<div className="flex flex-col items-end gap-0.5">
						<span className="text-[10px] uppercase font-mono tracking-wider text-white/60">Identitas</span>
						<span className="text-xs font-semibold text-white">
							{primaryId || "—"}
						</span>
					</div>
				</div>

				{data.actionHref && (
					<a
						href={data.actionHref}
						onClick={(e) => e.stopPropagation()}
						className="pointer-events-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
					>
						<span>{data.actionLabel || "Akses Layanan Sekarang"}</span>
						<span aria-hidden="true">&rarr;</span>
					</a>
				)}
			</div>
		</div>
	);

	// Render card face (either static or with tilt)
	const renderCardFace = (
		content: React.ReactNode,
		isStatic: boolean = false,
	) => {
		if (isStatic || forceSide) {
			return (
				<div className="relative h-full w-full overflow-hidden rounded-2xl shadow-xl">
					{OverlayLayer}
					{content}
					<div ref={ref} className={holoCardClasses} style={holoCardStyle}>
						{children}
					</div>
				</div>
			);
		}

		return (
			<Tilt className="relative h-full w-full overflow-hidden rounded-2xl p-0! shadow-xl">
				{OverlayLayer}
				{content}
				<div
					ref={ref}
					className={holoCardClasses}
					style={holoCardStyle}
					onMouseMove={handleOnMouseMove}
					onTouchMove={handleOnTouchMove}
					onMouseOut={handleOnMouseOut}
					onBlur={handleOnMouseOut}
				>
					{children}
				</div>
			</Tilt>
		);
	};

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleCardClick();
			}
		},
		[handleCardClick],
	);

	return (
		<div
			className={cn(forceSide ? "" : "perspective-1000", className)}
			onClick={handleCardClick}
			onKeyDown={!forceSide ? handleKeyDown : undefined}
			role={!forceSide ? "button" : undefined}
			tabIndex={!forceSide ? 0 : undefined}
			title={
				!forceSide ? `Profile card for ${name}. Click to flip.` : undefined
			}
			style={containerStyle}
		>
			<div
				className={
					forceSide ? "relative" : "relative transition-transform duration-700"
				}
				style={innerStyle}
			>
				{/* Front Side */}
				<div style={frontStyle}>
					{renderCardFace(renderFront ? renderFront(data) : FrontContent, !!forceSide)}
				</div>

				{/* Back Side */}
				<div style={backStyle}>
					{renderCardFace(renderBack ? renderBack(data) : BackContent, !!forceSide)}
				</div>
			</div>
		</div>
	);
};

export default HoloCard;
