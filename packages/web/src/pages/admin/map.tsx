import React, { useEffect, useRef } from 'react'
import AdminLayout from './layout';
import G6, { Graph } from "@antv/g6";
import { useParams } from 'react-router-dom'
import ReactDOM from 'react-dom'
import useSWR from 'swr';
import type { Level, LevelMap } from '@cyberrun/core'
import instance from '../../components/instance';

const MapPage = () => {
  const ref = useRef(null)
  const { id } = useParams<{ id: string }>()
  const { data, isValidating } = useSWR<{
    levels: Level[]
    maps: LevelMap[]
  }>(`/admin/games/${id}/maps`)
  const graph = useRef<Graph | null>(null)
  useEffect(() => {
    if (graph.current) {
      let render = {
        nodes: data?.levels.map(v => ({
          id: v._id.toString(),
          label: v.title,
          x: v.mapPoint.x,
          y: v.mapPoint.y
        })),
        edges: data?.maps.map(v => ({
          source: v.fromLevelId.toString(),
          target: v.toLevelId.toString(),
          style: {
            endArrow: true
          }
        }))
      }
      graph.current.data(render);
      graph.current.render();
    }

  }, [data, ref])

  const submitPosChange = (levelId: string, x: number, y: number) => {
    console.log(levelId, x, y)
    instance({
      url: `/admin/games/${id}/maps/${levelId}/mapPoint`,
      method: 'post',
      data: {
        x, y
      }
    })
  }

  useEffect(() => {
    if (!graph.current) {
      graph.current = new G6.Graph({
        // @ts-ignore
        container: ReactDOM.findDOMNode(ref!.current),
        height: 1080,
        width: 1920,
        defaultNode: {
          shape: "circle",
          size: [70],
          color: "#5B8FF9",
          style: {
            fill: "#9EC9FF",
            lineWidth: 3
          },
          labelCfg: {
            style: {
              fill: "#fff",
              fontSize: 20
            }
          }
        },
        defaultEdge: {
          style: {
            stroke: "#e2e2e2"
          }
        },
        modes: {
          default: ["drag-node"]
        },
        nodeStateStyles: {
          hover: {
            fill: "lightsteelblue"
          },
          click: {
            stroke: "#000",
            lineWidth: 3
          }
        },
        edgeStateStyles: {
          click: {
            stroke: "steelblue"
          }
        },
        layout: {
          preventOverlap: true,
          linkDistance: 200
        },
      })
      graph.current.on("node:dragend", (e) => {
        console.log(e)
        // @ts-ignore
        submitPosChange(e.item?.getID(), e.item?.getBBox().centerX, e.item?.getBBox().centerY)
      })
    }
    graph.current.render();
  }, [])
  return <AdminLayout>
    <div ref={ref}></div>
  </AdminLayout>
}

export default MapPage;