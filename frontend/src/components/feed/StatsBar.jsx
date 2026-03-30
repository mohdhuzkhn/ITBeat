import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/api';

export default function StatsBar() {
    const { data, isLoading } = useQuery({
        queryKey: ['platform-stats'],
        queryFn: () => userService.getStats().then(r => r.data),
        staleTime: 1000 * 60 * 5, // cache for 5 mins
    });

    const stats = [
        {
            label: 'Posts Published',
            value: data?.posts,
            icon: '📰',
        },
        // {
        //     label: 'Community Members',
        //     value: data?.users,
        //     icon: '👥',
        // },
        {
            label: 'Categories',
            value: data?.categories,
            icon: '🗂️',
        },
        // {
        //     label: 'Comments',
        //     value: data?.comments,
        //     icon: '💬',
        // },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-xs mx-auto">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="card p-4 text-center"
                >
                    <div className="text-xl mb-1">{s.icon}</div>
                    <p className="text-2xl font-bold text-blue-600">
                        {isLoading ? '—' : Number(s.value).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
            ))}
        </div>
    );
}






