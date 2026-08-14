import React from 'react';
import { OrderStageStatus } from '../context/CartContext';
import { 
  PackageCheck, 
  CheckCircle2, 
  ChefHat, 
  Package, 
  Truck, 
  Home, 
  Check 
} from 'lucide-react';

export interface PipelineStageConfig {
  key: OrderStageStatus;
  label: string;
  shortLabel: string;
  stepNumber: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;       // Background color for circle when active/completed
  textColor: string;   // Text color for label
  ringColor: string;   // Ring glow color
  badgeBg: string;     // Badge background
  badgeText: string;   // Badge text
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  { 
    key: 'PLACED',           
    label: 'Order Placed',    
    shortLabel: 'Placed',    
    stepNumber: 1, 
    icon: PackageCheck,
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    ringColor: 'ring-amber-200',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700 border-amber-200',
  },
  { 
    key: 'CONFIRMED',        
    label: 'Order Confirmed', 
    shortLabel: 'Confirmed', 
    stepNumber: 2, 
    icon: CheckCircle2,
    color: 'bg-sky-500',
    textColor: 'text-sky-700',
    ringColor: 'ring-sky-200',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700 border-sky-200',
  },
  { 
    key: 'PREPARING',        
    label: 'Preparing Food',  
    shortLabel: 'Preparing', 
    stepNumber: 3, 
    icon: ChefHat,
    color: 'bg-purple-600',
    textColor: 'text-purple-700',
    ringColor: 'ring-purple-200',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700 border-purple-200',
  },
  { 
    key: 'READY',            
    label: 'Ready & Packed',  
    shortLabel: 'Packed',    
    stepNumber: 4, 
    icon: Package,
    color: 'bg-pink-500',
    textColor: 'text-pink-700',
    ringColor: 'ring-pink-200',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700 border-pink-200',
  },
  { 
    key: 'OUT_FOR_DELIVERY', 
    label: 'Out for Delivery',
    shortLabel: 'On Route',  
    stepNumber: 5, 
    icon: Truck,
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    ringColor: 'ring-orange-200',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-700 border-orange-200',
  },
  { 
    key: 'DELIVERED',        
    label: 'Delivered',       
    shortLabel: 'Delivered', 
    stepNumber: 6, 
    icon: Home,
    color: 'bg-emerald-600',
    textColor: 'text-emerald-700',
    ringColor: 'ring-emerald-200',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
  },
];

interface OrderPipelineProps {
  currentStatus: OrderStageStatus;
  interactive?: boolean;
  onSelectStage?: (stage: OrderStageStatus) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const OrderPipeline: React.FC<OrderPipelineProps> = ({
  currentStatus,
  interactive = false,
  onSelectStage,
  disabled = false,
  compact = false,
}) => {
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = (activeIdx / (PIPELINE_STAGES.length - 1)) * 100;

  return (
    <div className="w-full select-none py-2">
      {/* ── Desktop & Tablet Horizontal Pipeline ── */}
      <div className="hidden sm:block max-w-3xl mx-auto px-4">
        <div className="relative">
          
          {/* Track Line — EXACTLY through the vertical center of the 40px circles (top: 20px) */}
          <div className="absolute left-5 right-5 top-5 -translate-y-1/2 h-1.5 bg-slate-200 rounded-full z-0" />
          
          {/* Active Gradient Filled Progress Line */}
          <div 
            className="absolute left-5 top-5 -translate-y-1/2 h-1.5 bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 rounded-full z-0 transition-all duration-500 ease-in-out shadow-sm"
            style={{ width: `calc((100% - 40px) * ${activeIdx / (PIPELINE_STAGES.length - 1)})` }}
          />

          {/* Stepper Nodes */}
          <div className="relative z-10 flex items-start justify-between">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCompleted = idx < activeIdx;
              const isCurrent = idx === activeIdx;
              const canClick = interactive && !disabled;

              return (
                <div 
                  key={stage.key}
                  className="flex flex-col items-center cursor-default group"
                  style={{ width: '82px' }}
                  onClick={() => {
                    if (canClick && onSelectStage) {
                      onSelectStage(stage.key);
                    }
                  }}
                >
                  {/* Circle Node (40px x 40px) with Distinctive Stage Color */}
                  <button
                    type="button"
                    disabled={!canClick}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-sm
                      ${canClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                      ${
                        isCurrent
                          ? `${stage.color} text-white ring-4 ${stage.ringColor} scale-110 shadow-md`
                          : isCompleted
                          ? `${stage.color} text-white ring-4 ring-white hover:opacity-90`
                          : 'bg-white text-slate-400 border-2 border-slate-300 ring-4 ring-white'
                      }
                    `}
                    title={canClick ? `Switch stage to: ${stage.label}` : stage.label}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </button>

                  {/* Stage Label with Individual Accent Color */}
                  <div className="mt-2.5 text-center">
                    <p className={`text-xs leading-tight font-bold ${
                      isCurrent 
                        ? `${stage.textColor} font-black` 
                        : isCompleted 
                        ? 'text-slate-800 font-semibold' 
                        : 'text-slate-400 font-medium'
                    }`}>
                      {compact ? stage.shortLabel : stage.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Mobile Vertical Pipeline ── */}
      <div className="sm:hidden px-2">
        <div className="relative pl-6 space-y-4">
          
          {/* Vertical Track Line — centered at x: 16px (middle of 32px circle) */}
          <div className="absolute left-[27px] top-4 bottom-4 w-1 bg-slate-200 -translate-x-1/2 z-0 rounded-full" />
          <div 
            className="absolute left-[27px] top-4 w-1 bg-gradient-to-b from-amber-500 via-purple-500 to-emerald-500 -translate-x-1/2 z-0 rounded-full transition-all duration-500"
            style={{ height: `${progressPercent}%` }}
          />

          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const canClick = interactive && !disabled;

            return (
              <div
                key={stage.key}
                onClick={() => {
                  if (canClick && onSelectStage) {
                    onSelectStage(stage.key);
                  }
                }}
                className={`
                  relative z-10 flex items-center gap-3 py-1 transition-all
                  ${canClick ? 'cursor-pointer' : ''}
                `}
              >
                {/* Circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all shadow-sm ring-4 ring-white
                    ${
                      isCurrent
                        ? `${stage.color} text-white ring-4 ${stage.ringColor} scale-105`
                        : isCompleted
                        ? `${stage.color} text-white`
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Text Label */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className={`text-xs font-bold ${
                    isCurrent ? `${stage.textColor} font-extrabold` : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className={`text-[10px] font-bold ${stage.badgeBg} border ${stage.badgeText} px-2 py-0.5 rounded-full`}>
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
