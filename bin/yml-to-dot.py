#!/usr/bin/env python3


from collections import defaultdict, Counter
import yaml
import sys
from textwrap import dedent, indent


I4 = ' ' * 4


def get_column_action_map(flows):
    result = defaultdict(list)

    for flow, steps in flows.items():
        for step in steps:
            column, action = next(iter(step.items()))

            result[column].append(action)

    return result


def prologue(graph):
    label = graph.get('label', '')

    print(dedent(f'''\
        strict digraph "" {{

            graph [
                label="{label}"
                style=dotted
                labelloc=t
                fontname=Arial
                compound=true
            ];
            node [fontname=Arial];
    '''))


def section_actions(column_action_map):
    print(indent(dedent('''\
        // Actions.
        node [shape=rect];
    '''), I4))

    for column, actions in column_action_map.items():
        for i, action in enumerate(actions):
            node = f'{column}_{i}'
            print(indent(f'{node} [label=<{action}>];', I4))
    print()


def section_flowlines(flows, column_action_map):
    print(indent(dedent(f'''\
        // Flow lines.
        edge [color=blue weight=1000];
    '''), I4))

    column_count = Counter()
    render_steps = []

    for flow, steps in flows.items():
        nodes = []
        for step in steps:
            column = next(iter(step))
            nodes.append(f'{column}_{column_count[column]}')
            column_count[column] += 1

        # (Indent should match next print's indent.)
        render_steps = ('\n' + (I4 * 3) + '-> ').join(nodes)

        print(indent(dedent(f'''\
            // {flow}
            {render_steps};
        '''), I4))


def section_swimlanes(column_label_map, column_action_map):
    print(indent(dedent('''\
        // Actors/swimlanes.
        node [style=invis];
        edge [style=invis weight=0 constraint=true];
    '''), I4))

    for column, actions in column_action_map.items():
        label = column_label_map.get(column, column)

        render_actions = ('\n' + (I4 * 4) + '-> ').join(
            f'{column}_{i}' for i in range(len(actions))
        )

        print(indent(dedent(f'''\
            subgraph cluster_{column} {{
                label="{label}"

                {render_actions};
            }}
        '''), I4))


def epilogue():
    print('}')


def main():
    if len(sys.argv) != 2:
        print(f'Usage:  {sys.argv[0]} {{yml_file}}', file=sys.stderr)
        sys.exit(-1)

    _, yml_file = sys.argv

    spec = yaml.load(open(yml_file))

    flows = spec['Flows']
    column_label_map = {
        column: label
        for column_spec in spec['Columns']
        for column, label in column_spec.items()
    }
    column_action_map = get_column_action_map(flows)

    # Render.
    prologue(spec['Graph'])

    section_actions(column_action_map)

    section_flowlines(flows, column_action_map)

    section_swimlanes(column_label_map, column_action_map)

    epilogue()


main()

