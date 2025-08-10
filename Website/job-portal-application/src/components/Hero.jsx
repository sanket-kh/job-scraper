<h1 className="text-4xl md:text-5xl font-bold text-gray-900"></h1>
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const HeroSection = () => {
    const navigate = useNavigate();
    const handleSearch = () => {
        navigate('/jobs');
    };

    const heading = "best home work";
    const headingWords = ["world's", "best", "home", "work"];

    return (
        <div className="flex flex-col md:flex-row items-center justify-between px-28 py-20 bg-white">
            {/* Left Side - Content */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className="space-y-6 max-w-xl"
            >
                <div className="space-y-4">
                    <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                        Find world's best{' '}
                        <span className="inline-block">
                            {Array.from('home work').map((char, idx) => (
                                <motion.span
                                    key={idx}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: 0.08 * idx,
                                        duration: 0.4,
                                        type: 'spring',
                                    }}
                                    className="font-extrabold inline-block"
                                    style={{ color: '#002060' }}
                                >
                                    {char === ' ' ? '\u00A0' : char}
                                </motion.span>
                            ))}
                        </span>
                    </h1>


                </div>




                <p className="text-lg text-gray-600">
                    Discover the best remote and work from home jobs at top remote companies.
                </p>

                {/* Search Bar */}
                <div className="flex items-center space-x-2 bg-[#002060]-100 p-3 rounded-lg shadow-sm">
                    <Search className="text-gray-500" />
                    <input
                                type="text"
                                placeholder="Search jobs..."
                                className="bg-transparent outline-none w-full text-gray-800 placeholder-gray-500"
                            />
                    <button
                                onClick={handleSearch}
                                className="text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                style={{backgroundColor: '#002060'}}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#001440'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#002060'}
                            >
                                Search
                            </button>
                </div>

                {/* Stats */}
                <div className="flex space-x-10 pt-4">
                    <div>
                        <p className="text-gray-500">Jobs submitted</p>
                        <motion.p
                            className="text-xl font-semibold text-gray-800"
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, type: 'spring' }}
                        >
                            <AnimatedNumber value={60000} suffix="+" />
                        </motion.p>
                    </div>
                    <div>
                        <p className="text-gray-500">Monthly Users</p>
                        <motion.p
                            className="text-xl font-semibold text-gray-800"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, type: 'spring', delay: 0.2 }}
                        >
                            <AnimatedNumber value={30000} suffix="+" />
                        </motion.p>
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Illustration */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className="mt-10 md:mt-0 md:w-1/2"
            >
                <img
                    src="https://civi.uxper.co/wp-content/uploads/2023/01/image-home-03.webp"
                    alt="Remote work illustration"
                    className="w-full max-w-md mx-auto"
                />
            </motion.div>
        </div>
    );
};

// AnimatedNumber component for running number effect
function AnimatedNumber({ value, duration = 1.2, suffix = '' }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        const increment = end / (duration * 60);
        let frame;
        function animate() {
            start += increment;
            if (start < end) {
                setDisplay(Math.floor(start));
                frame = requestAnimationFrame(animate);
            } else {
                setDisplay(end);
            }
        }
        animate();
        return () => cancelAnimationFrame(frame);
    }, [value, duration]);
    return <span>{display.toLocaleString()}{suffix}</span>;
}

export default HeroSection;