import './App.css';
import React from 'react';

const PROJECTS = [
  {
    "id": "26071055",
    "name": "🎨 In Progress"
  },
  {
    "id": "19821474",
    "name": "💡 New Features"
  }
];

class App extends React.Component {
  state = {
    token: '',
    teamId: '915624959988940260',
    stage: 'IDLE',
    filesMap: {},  // { projectId: { key, name, thumbnail_url }[] }
    canvasesMap: {},  // { fileId: { id, name }[] }
  }

  handleTokenChange = (e) => {
    const { value } = e.currentTarget;
    this.setState({ token: value });
  }

  handleTeamIdChange = (e) => {
    const { value } = e.currentTarget;
    this.setState({ teamId: value });
  }

  handleFetch = async () => {
    for (const { id } of PROJECTS) {
      this.handleFetchFiles(id);
    }
    this.setState({ stage: 'FETCHED' });
  }

  handleFetchFiles = async (projectId) => {
    const resp = await fetch(`https://api.figma.com/v1/projects/${projectId}/files`, {
      method: 'GET',
      headers: {
        'X-FIGMA-TOKEN': this.state.token,
      },
    });
    if (resp.ok) {
      const json = await resp.json();
      const files = json.files || [];
      this.setState(state => ({ 
        filesMap: { 
          ...state.filesMap, 
          [projectId]: files,
        }
      }));
      files.map(f => this.handleFetchCanvases(f.key));
    }
  }

  handleFetchCanvases = async (fileId) => {
    const resp = await fetch(`https://api.figma.com/v1/files/${fileId}?depth=1`, {
      method: 'GET',
      headers: {
        'X-FIGMA-TOKEN': this.state.token,
      },
    });
    if (resp.ok) {
      const json = await resp.json();
      const canvases = (json.document && json.document.children || []).map(c => ({ id: c.id, name: c.name }));
      this.setState(state => ({
        canvasesMap: {
          ...state.canvasesMap,
          [fileId]: canvases,
        }
      }))
    }
  }

  render() {
    const { state, handleTokenChange, handleTeamIdChange, handleFetch, handleFetchFiles } = this;
    return (
      <div className="px-12 py-12">
        <div className="font-semibold text-2xl mb-4">
          Table of Content
        </div>

        <div className="space-y-2 mb-2">
          <div>
            <div className="text-sm font-semibold mb-px">
              Token
            </div>
            <input value={state.token} onChange={handleTokenChange} className="rounded border border-gray-400 outline-shadow px-2 py-1 w-full max-w-sm" />
          </div>
          <div className="hidden">
            <div className="text-sm font-semibold mb-px">
              Team ID
            </div>
            <input value={state.teamId} onChange={handleTeamIdChange} className="rounded border border-gray-400 outline-shadow px-2 py-1 w-full max-w-sm" />
          </div>
        </div>

        <div>
          <button onClick={handleFetch} className="px-6 py-1 text-sm rounded bg-blue-500 text-white">
            Show it
          </button>
        </div>

        {state.stage === 'FETCHED' ? (
          <div className="space-y-8 mt-8 text-lg flex flex-col items-start">
            {PROJECTS.map(({ id, name: pName }) => (
              <div>
                <div key={id} className="cursor-default mb-4">
                  {pName}
                </div>
                {state.filesMap[id] ? (
                  <div className="ml-2 flex justify-start items-start flex-wrap">
                    {state.filesMap[id].map(({ key, name: fName, thumbnail_url }) => (
                      <div key={key} className="flex-shrink-0 w-96 text-sm mr-4 mb-4 truncate rounded border border-gray-300 px-2 py-1">
                        <div>
                          <img src={thumbnail_url} alt="" className="max-w-full" />
                        </div>
                        <div className="font-semibold mt-2">
                          {fName}
                        </div>
                        {state.canvasesMap[key] ? (
                          <div className="mt-1 space-y-1">
                            {state.canvasesMap[key].map(({ id, name }) => (
                              <a href={`https://www.figma.com/file/${key}/?node-id=${id}`} target="_blank" key={id} className="underline text-blue-500 block">
                                {name}
                              </a>
                            ))}
                          </div>
                        ) : null}

                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

export default App;
