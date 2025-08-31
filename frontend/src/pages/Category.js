import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCategory } from '../services/api';

function Category() {
  const { category } = useParams();
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const data = await fetchCategory(category);
        setPlugins(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadCategory();
  }, [category]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mt-5">
      <h1>{category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
      <div className="row g-4">
        {plugins.map(plugin => (
          <div key={plugin.key} className="col-md-6 col-lg-4">
            <div className="card h-100 plugin-card tilt-card border-0 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div className="icon-wrapper rounded-circle bg-primary d-flex align-items-center justify-content-center me-3">
                    <i className={`fas ${plugin.icon} fa-fw text-white`}></i>
                  </div>
                  <h5 className="card-title mb-0">{plugin.name}</h5>
                </div>
                <p className="card-text text-muted mb-4 flex-grow-1">{plugin.description}</p>
                <a href={`/plugin/${plugin.key}`} className="btn btn-primary">
                  Run Simulation <i className="fas fa-chevron-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Category; 