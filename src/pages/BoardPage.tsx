import { BatchActionsBar } from '../components/table/BatchActionsBar';
import { BoardHeader } from '../components/board/BoardHeader';
import { Table } from '../components/table/Table';
import { useBoardStore } from '../store/useBoardStore';

export const BoardPage = () => {
    const activeBoardId = useBoardStore(state => state.activeBoardId);

    // Safety check, though App.tsx should handle this
    if (!activeBoardId) return null;

    return (
        <>
            <BoardHeader boardId={activeBoardId} />
            <div style={{ flex: 1, overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column' }}>
                <Table boardId={activeBoardId} />
            </div>
            <BatchActionsBar />
        </>
    );
};
