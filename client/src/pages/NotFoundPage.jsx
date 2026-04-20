import React from 'react';
import Canyon404 from '@/components/CrazyComponents/jsx/404';

/**
 * 404 Not Found Page
 * Renders the "Canyon" parallax error UI.
 */
export default function NotFoundPage() {
    return (
        <Canyon404 
            errorCode="404"
            title="404 - Not Found"
            subtitle="Sorry, there's nothing to see here but cacti :("
        />
    );
}
