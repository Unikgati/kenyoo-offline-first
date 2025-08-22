
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const LoginScreen: React.FC = () => {
    const { login, error: authError } = useAuth();
    const { settings } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (authError) {
            setError(authError.message || 'An unknown authentication error occurred.');
            setLoading(false);
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        await login(email, password);
        // Loading state will be turned off by the error useEffect if login fails
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
             <div className="absolute inset-0 z-0" aria-hidden="true">
                <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full animate-float" style={{ animationDuration: '30s' }} />
                <div className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full animate-float" style={{ animationDuration: '25s', animationDelay: '5s' }} />
                <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-secondary/20 rounded-full animate-float" style={{ animationDuration: '35s', animationDelay: '10s' }} />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/5 rounded-full animate-float" style={{ animationDuration: '40s', animationDelay: '2s' }} />
             </div>
            <Card className="w-full max-w-sm z-10 relative">
                <CardHeader className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Login</h1>
                    <CardTitle className="text-lg font-normal text-foreground/80">Welcome to {settings.name}</CardTitle>
                    <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" loading={loading}>
                            Sign In
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginScreen;
