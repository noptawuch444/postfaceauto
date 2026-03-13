import { Outlet } from 'react-router-dom';

function PublicLayout() {
    return (
        <div className="gs-public-page">
            <Outlet />
        </div>
    );
}

export default PublicLayout;
