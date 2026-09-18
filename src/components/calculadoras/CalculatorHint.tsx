interface Props {
	children: React.ReactNode;
}

export default function CalculatorHint({ children }: Props) {
	return (
		<div className="mb-4 rounded-xl bg-primary/5 px-4 py-3 text-sm text-ink/70 ring-1 ring-primary/10">
			<span className="font-semibold text-primary">Para empezar:</span> {children}
		</div>
	);
}
