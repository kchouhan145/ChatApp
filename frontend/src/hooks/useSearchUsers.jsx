import { useState } from 'react';
import axios from 'axios';

const useSearchUsers = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const searchUsers = async (username) => {
        if (!username || username.trim() === '') {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            axios.defaults.withCredentials = true;
            const res = await axios.get(`https://dczone.onrender.com/api/v1/user/search?username=${encodeURIComponent(username.trim())}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchError('Failed to search users');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchResults([]);
        setSearchError(null);
    };

    return {
        searchResults,
        isSearching,
        searchError,
        searchUsers,
        clearSearch
    };
};

export default useSearchUsers;
