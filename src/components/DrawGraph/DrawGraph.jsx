import React, { useState, useReducer, useRef } from 'react';
import Node from './Node';
import Edge from './Edge';
import EditWeight from './EditWeight';
import Instructions from './Instructions';
import ExportImport from './ExportImport';
import BackButton from './Buttons/BackButton';
import FinishButton from './Buttons/FinishButton';
import WeightedEdgesToggle from './Buttons/WeightedEdgesToggle';
import DirectedEdgesToggle from './Buttons/DirectedEdgesToggle';
import NewButton from './Buttons/NewButton';
import './DrawGraph.css';
import '../extra/Extra.css';

function dataReducer(state, event) {
  switch (event.name) {
    case 'add-node':
      return {
        ...state,
        nodes: { ...state.nodes, [event.value.id ?? state.topNode]: event.value.node },
        topNode: state.topNode + (event.value.id === undefined ? 1 : 0),
      };
    case 'add-edge':
      return {
        ...state,
        edges: { ...state.edges, [event.value.id ?? state.topEdge]: event.value.edge },
        topEdge: state.topEdge + (event.value.id === undefined ? 1 : 0),
      };
    case 'delete-node':
      delete state.nodes[event.value];
      return state;
    case 'edit-edge':
      state.edges[event.value.id].w = event.value.weight;
      return state;
    case 'delete-edge':
      delete state.edges[event.value];
      return state;
    case 'set-graph':
      return event.value;
    case 'set-isWeighted':
      return { ...state, isWeighted: event.value };
    case 'set-isDirected':
      return { ...state, isDirected: event.value };
    default:
      throw new Error();
  }
}
export default function Canvas() {
  const blankGraph = { topNode: 0, topEdge: 0, isWeighted: false, isDirected: false, nodes: {}, edges: {} };
  const [graphData, updateGraphData] = useReducer(dataReducer, blankGraph);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentEdge, setCurrentEdge] = useState(null);
  //Vector to draw temporary line
  const [edgeVector, setEdgeVector] = useState({ x: 0, y: 0 });
  //Set to check if an edge between u,v exists
  const [edgesSet, setEdgesSet] = useState(() => new Set());

  function addToSet(item) {
    setEdgesSet((prev) => new Set(prev).add(item));
  }
  function removeFromSet(item) {
    setEdgesSet((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }

  function createNode(posX, posY) {
    updateGraphData({
      name: 'add-node',
      value: { node: { x: posX, y: posY } },
    });
  }
  function createEdge(first, second) {
    if (first === second) return;
    if (edgesSet.has(JSON.stringify([first, second]))) return;
    addToSet(JSON.stringify([first, second]));
    updateGraphData({
      name: 'add-edge',
      value: { edge: { u: first, v: second, w: 1 } },
    });
  }
  function deleteNode(id) {
    Object.entries(graphData.edges).forEach((element) => {
      const key = element[0];
      const edge = element[1];
      if (edge.u === id || edge.v === id) deleteEdge(key);
    });
    updateGraphData({
      name: 'delete-node',
      value: id,
    });
  }
  function deleteEdge(id) {
    removeFromSet(JSON.stringify([graphData.edges[id].u, graphData.edges[id].v]));
    updateGraphData({
      name: 'delete-edge',
      value: id,
    });
  }
  function handleClickEdge(id) {
    setCurrentEdge(id);
    setCurrentNode(null);
  }
  // Drag and drop functionality
  const dragTimeoutId = useRef('');
  const [isDragging, setIsDragging] = useState(false);

  function handleMouseUpNode() {
    if (isDragging) {
      DropNode();
    } else {
      clearTimeout(dragTimeoutId.current);
    }
  }
  function handleClickNode(id) {
    if (currentNode == null) {
      clear();
      setCurrentNode(id);
      dragTimeoutId.current = setTimeout(() => {
        setIsDragging(true);
      }, 100);
    } else {
      createEdge(currentNode, id);
      setCurrentNode(null);
    }
  }
  function DragNode(posX, posY) {
    updateGraphData({
      name: 'add-node',
      value: { id: currentNode, node: { x: posX, y: posY } },
    });
  }
  function DropNode() {
    setCurrentNode(null);
    setIsDragging(false);
  }
  function editWeight(id, weight) {
    updateGraphData({
      name: 'edit-edge',
      value: { id, weight },
    });
  }
  function clear() {
    setCurrentNode(null);
    setCurrentEdge(null);
  }
  function setGraph(graph) {
    updateGraphData({
      name: 'set-graph',
      value: graph,
    });
    edgesSet.clear();
    Object.values(graph.edges).forEach((edge) => {
      addToSet(JSON.stringify([edge.u, edge.v]));
    });
  }
  return (
    <div className='popup-out'>
      <div className='draw-graph-container popup-in'>
        <Instructions />
        <svg
          className='draw-graph'
          onMouseDown={(event) => {
            if (currentNode == null && currentEdge == null) createNode(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            else clear();
          }}
          onMouseMove={(event) => {
            if (isDragging) {
              DragNode(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            } else {
              setEdgeVector({
                x: event.nativeEvent.offsetX,
                y: event.nativeEvent.offsetY,
              });
            }
          }}
          onMouseUp={handleMouseUpNode}
          onKeyDown={(event) => {
            if (event.code === 'Escape') {
              setCurrentNode(null);
              setCurrentEdge(null);
            }
            if (event.code === 'Delete') {
              if (currentEdge != null) {
                deleteEdge(currentEdge);
              }
              if (currentNode != null) deleteNode(currentNode);
              setCurrentNode(null);
              setCurrentEdge(null);
            }
          }}
          tabIndex='0'
        >
          {currentNode != null && isDragging === false && (
            <line
              x1={graphData.nodes[currentNode].x}
              y1={graphData.nodes[currentNode].y}
              x2={edgeVector.x}
              y2={edgeVector.y}
              stroke='black'
              strokeWidth='3px'
            />
          )}
          {Object.entries(graphData.edges).map((element) => {
            const idx = element[0];
            const edge = element[1];
            return (
              <Edge
                key={idx}
                id={idx}
                edge={edge}
                currentEdge={currentEdge}
                position={{
                  x1: graphData.nodes[edge.u].x,
                  y1: graphData.nodes[edge.u].y,
                  x2: graphData.nodes[edge.v].x,
                  y2: graphData.nodes[edge.v].y,
                }}
                setCurrentEdge={setCurrentEdge}
                handleClick={handleClickEdge}
                isWeighted={graphData.isWeighted}
                isDirected={graphData.isDirected}
                isCurved={edgesSet.has(JSON.stringify([edge.v, edge.u]))}
              />
            );
          })}
          {Object.entries(graphData.nodes).map((element) => {
            const idx = element[0];
            const node = element[1];
            return (
              <Node
                key={idx}
                id={idx}
                position={node}
                handleClick={handleClickNode}
                currentNode={currentNode}
                isDragged={isDragging && idx === currentNode}
              />
            );
          })}
        </svg>
        {currentEdge != null && graphData.isWeighted && (
          <EditWeight currentEdge={currentEdge} setCurrentEdge={setCurrentEdge} handleSubmit={editWeight} />
        )}
        <ExportImport graphData={graphData} setGraph={setGraph} />
        <BackButton />
        <WeightedEdgesToggle
          isWeighted={graphData.isWeighted}
          setIsWeighted={(checked) => updateGraphData({ name: 'set-isWeighted', value: checked })}
        />
        <FinishButton />
        <DirectedEdgesToggle
          isDirected={graphData.isDirected}
          setIsDirected={(checked) => updateGraphData({ name: 'set-isDirected', value: checked })}
        />
        <NewButton resetGraph={() => setGraph(blankGraph)} />
      </div>
    </div>
  );
}
