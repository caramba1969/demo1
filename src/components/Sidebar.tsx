import { FC } from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface SidebarProps {
	onAddFactory: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ onAddFactory }) => (
	<aside className="fixed left-0 top-12 w-64 h-[calc(100vh-3rem)] bg-neutral-950 border-r border-neutral-800 flex flex-col gap-2 p-3 z-40 overflow-y-auto">
		<div className="flex flex-col gap-2 mb-2">
			<Button
				variant="default"
				className="w-full bg-blue-600 hover:bg-blue-700 text-white"
				aria-label="Add Factory"
				onClick={onAddFactory}
			>
				<Plus className="w-4 h-4 mr-1" /> Add Factory
			</Button>
		</div>
		<div className="flex flex-col gap-2 flex-1" />
	</aside>
);
