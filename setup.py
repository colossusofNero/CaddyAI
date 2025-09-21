from setuptools import setup, find_packages

setup(
    name="caddy-ai-ml",
    version="1.0.0",
    description="Machine Learning enhancements for golf recommendation system",
    author="CaddyAI Team",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "torch>=2.0.0",
        "transformers>=4.30.0",
        "spacy>=3.6.0",
        "scikit-learn>=1.3.0",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "fastapi>=0.100.0",
        "uvicorn>=0.22.0",
        "pydantic>=2.0.0",
        "datasets>=2.12.0",
        "accelerate>=0.20.0",
        "evaluate>=0.4.0",
        "seqeval>=1.2.2",
    ],
    extras_require={
        "dev": ["pytest>=7.4.0", "pytest-asyncio>=0.21.0", "black", "isort", "mypy"],
        "monitoring": ["mlflow>=2.4.0", "wandb>=0.15.0"],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)